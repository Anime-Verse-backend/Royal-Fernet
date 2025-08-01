
import os
import uuid
import json
import pymysql
import io
import qrcode
from docx import Document
from docx.shared import Inches
from flask import send_file, send_from_directory, request, jsonify
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime

# --- App Initialization ---
load_dotenv()
app = Flask(__name__)

# --- CORS Configuration ---
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:9002')
CORS(app, resources={r"/*": {"origins": FRONTEND_URL, "supports_credentials": True}})

# --- Database Connection Helper ---
def get_db_connection():
    # Aiven requires SSL, so we need to specify the CA certificate
    ssl_args = {}
    ca_path = os.path.join(os.path.dirname(__file__), 'ca.pem')
    if os.path.exists(ca_path):
        ssl_args['ssl_ca'] = ca_path
        ssl_args['ssl_verify_cert'] = True

    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT', 3306)),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            **ssl_args
        )
        return connection
    except pymysql.MySQLError as e:
        app.logger.error(f"Error connecting to MySQL: {e}")
        return None

# --- File Upload Configuration ---
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Helper Functions ---
def make_image_url_absolute(path):
    if not path or path.startswith(('http://', 'https://')):
        return path
    api_base = os.getenv('API_BASE_URL', request.host_url)
    return f"{api_base.rstrip('/')}{path}"

def process_image_paths_for_response(image_paths_json):
    if not image_paths_json:
        return []
    try:
        image_paths = json.loads(image_paths_json) if isinstance(image_paths_json, str) else image_paths_json
        return [make_image_url_absolute(path) for path in image_paths if path]
    except (json.JSONDecodeError, TypeError):
        app.logger.error(f"Could not parse images JSON: {image_paths_json}")
        return []

def format_colombian_pesos(amount):
    try:
        return f"${int(amount):,}".replace(",", ".")
    except (ValueError, TypeError):
        return str(amount)

# --- API Routes ---

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(data['password'])
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (data['name'], data['email'], hashed_password, 'user'))
        conn.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except pymysql.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    finally:
        if conn:
            conn.close()

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM users WHERE email = %s AND role = 'admin'"
            cursor.execute(sql, (data['email'],))
            user = cursor.fetchone()
            if user and check_password_hash(user['password_hash'], data['password']):
                return jsonify({'message': 'Login successful', 'user': {'name': user['name'], 'email': user['email']}}), 200
            else:
                return jsonify({'error': 'Invalid credentials or not an admin'}), 401
    finally:
        if conn:
            conn.close()

@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        if request.method == 'POST':
            image_paths = []
            for i in range(1, 5):
                file_key = f'image{i}'
                url_key = f'imageUrl{i}'
                if file_key in request.files and request.files[file_key].filename != '':
                    file = request.files[file_key]
                    if file and allowed_file(file.filename):
                        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
                        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                        image_paths.append(f"/uploads/{filename}")
                elif request.form.get(url_key):
                    image_paths.append(request.form.get(url_key))
            
            product_data = {
                'id': str(uuid.uuid4()),
                'name': request.form.get('name'),
                'description': request.form.get('description'),
                'category': request.form.get('category'),
                'price': request.form.get('price'),
                'discount': request.form.get('discount', 0),
                'stock': request.form.get('stock', 100),
                'images': json.dumps(image_paths),
                'is_featured': request.form.get('isFeatured') == 'on'
            }
            with conn.cursor() as cursor:
                sql = """INSERT INTO products (id, name, description, category, price, discount, stock, images, is_featured) 
                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                cursor.execute(sql, tuple(product_data.values()))
            conn.commit()
            product_data['images'] = process_image_paths_for_response(product_data['images'])
            return jsonify(product_data), 201
        
        # GET Products
        query = request.args.get('q')
        with conn.cursor() as cursor:
            if query:
                search_term = f"%{query}%"
                sql = "SELECT * FROM products WHERE name LIKE %s OR category LIKE %s ORDER BY created_at DESC"
                cursor.execute(sql, (search_term, search_term))
            else:
                sql = "SELECT * FROM products ORDER BY created_at DESC"
                cursor.execute(sql)
            
            products = cursor.fetchall()
            for p in products:
                p['images'] = process_image_paths_for_response(p['images'])
            return jsonify(products)
    finally:
        if conn:
            conn.close()

@app.route('/api/products/<string:product_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_product(product_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'GET':
                cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
                product = cursor.fetchone()
                if product:
                    product['images'] = process_image_paths_for_response(product['images'])
                    return jsonify(product)
                return jsonify({'error': 'Product not found'}), 404
            
            elif request.method == 'PUT':
                api_base_url = os.getenv('API_BASE_URL', request.host_url).rstrip('/')
                new_image_paths = []
                for i in range(1, 5):
                    if f'image{i}' in request.files and request.files[f'image{i}'].filename != '':
                        file = request.files[f'image{i}']
                        if file and allowed_file(file.filename):
                            filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
                            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                            new_image_paths.append(f"/uploads/{filename}")
                    elif request.form.get(f'imageUrl{i}'):
                        existing_url = request.form.get(f'imageUrl{i}')
                        if existing_url.startswith(api_base_url):
                            new_image_paths.append(existing_url.replace(api_base_url, '', 1))
                        else:
                            new_image_paths.append(existing_url)
                
                sql = """UPDATE products SET name=%s, description=%s, category=%s, price=%s, discount=%s, stock=%s, images=%s, is_featured=%s
                         WHERE id=%s"""
                values = (
                    request.form.get('name'), request.form.get('description'), request.form.get('category'),
                    request.form.get('price'), request.form.get('discount', 0), request.form.get('stock', 100),
                    json.dumps(new_image_paths), request.form.get('isFeatured') == 'on', product_id
                )
                cursor.execute(sql, values)
                conn.commit()
                return jsonify({'message': 'Product updated successfully'})

            elif request.method == 'DELETE':
                cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
                conn.commit()
                return jsonify({'message': 'Product deleted'})
    finally:
        if conn:
            conn.close()

@app.route('/api/admins', methods=['GET', 'POST'])
def handle_admins():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                data = request.get_json()
                if not data or not data.get('name') or not data.get('email') or not data.get('password'):
                    return jsonify({'error': 'Missing required fields'}), 400
                hashed_password = generate_password_hash(data['password'])
                sql = "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, 'admin')"
                cursor.execute(sql, (data['name'], data['email'], hashed_password))
                conn.commit()
                return jsonify({'name': data['name'], 'email': data['email']}), 201
            
            # GET Admins
            query = request.args.get('q')
            sql = "SELECT id, name, email FROM users WHERE role = 'admin'"
            if query:
                sql += " AND (name LIKE %s OR email LIKE %s)"
                cursor.execute(sql, (f"%{query}%", f"%{query}%"))
            else:
                cursor.execute(sql)
            admins = cursor.fetchall()
            return jsonify(admins)
    except pymysql.IntegrityError:
        return jsonify({'error': 'Admin with that email already exists'}), 409
    finally:
        if conn:
            conn.close()

@app.route('/api/admins/<int:admin_id>', methods=['DELETE'])
def handle_admin(admin_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
            admin_count = cursor.fetchone()['count']
            if admin_count <= 1:
                return jsonify({'error': 'Cannot delete the last administrator'}), 400
            
            rows_affected = cursor.execute("DELETE FROM users WHERE id = %s AND role = 'admin'", (admin_id,))
            if rows_affected == 0:
                return jsonify({'error': 'Administrator not found'}), 404
            conn.commit()
            return jsonify({'message': 'Administrator deleted successfully'})
    finally:
        if conn:
            conn.close()

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                data = request.form
                hero_images_json = data.get('heroImages', '[]')
                hero_images_data = json.loads(hero_images_json)
                processed_hero_images = []
                for index, slide in enumerate(hero_images_data):
                    file_key = f'heroImageFile_{index}'
                    if file_key in request.files and request.files[file_key].filename != '':
                        file = request.files[file_key]
                        if file and allowed_file(file.filename):
                            filename = secure_filename(f"setting_hero_{uuid.uuid4()}_{file.filename}")
                            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                            slide['imageUrl'] = f"/uploads/{filename}"
                    processed_hero_images.append(slide)

                sql = """INSERT INTO settings (id, heroImages, featuredCollectionTitle, featuredCollectionDescription, promoSectionTitle, promoSectionDescription, promoSectionVideoUrl, phone, contactEmail, twitterUrl, instagramUrl, facebookUrl)
                         VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                         ON DUPLICATE KEY UPDATE
                         heroImages=VALUES(heroImages), featuredCollectionTitle=VALUES(featuredCollectionTitle), featuredCollectionDescription=VALUES(featuredCollectionDescription),
                         promoSectionTitle=VALUES(promoSectionTitle), promoSectionDescription=VALUES(promoSectionDescription), promoSectionVideoUrl=VALUES(promoSectionVideoUrl),
                         phone=VALUES(phone), contactEmail=VALUES(contactEmail), twitterUrl=VALUES(twitterUrl), instagramUrl=VALUES(instagramUrl), facebookUrl=VALUES(facebookUrl)"""
                values = (
                    json.dumps(processed_hero_images), data.get('featuredCollectionTitle'), data.get('featuredCollectionDescription'),
                    data.get('promoSectionTitle'), data.get('promoSectionDescription'), data.get('promoSectionVideoUrl'),
                    data.get('phone'), data.get('contactEmail'), data.get('twitterUrl'), data.get('instagramUrl'), data.get('facebookUrl')
                )
                cursor.execute(sql, values)
                conn.commit()
                cursor.execute("SELECT * FROM settings WHERE id = 1")
                settings = cursor.fetchone()
                if settings and settings.get('heroImages'):
                    settings['heroImages'] = process_image_paths_for_response(settings['heroImages'])
                return jsonify(settings)
            
            # GET request
            cursor.execute("SELECT * FROM settings WHERE id = 1")
            settings = cursor.fetchone()
            if settings:
                if settings.get('heroImages'):
                    settings['heroImages'] = process_image_paths_for_response(settings['heroImages'])
                return jsonify(settings)
            return jsonify({}), 404
    finally:
        if conn:
            conn.close()

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO notifications (message, imageUrl, linkUrl) VALUES (%s, %s, %s)"
            cursor.execute(sql, (data['message'], data.get('imageUrl'), data.get('linkUrl')))
        conn.commit()
        return jsonify({'message': 'Notification created'}), 201
    finally:
        if conn:
            conn.close()

@app.route('/api/notifications/latest', methods=['GET'])
def get_latest_notification():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1")
            notification = cursor.fetchone()
            if not notification:
                return jsonify({'error': 'No notifications found'}), 404
            if notification.get('imageUrl'):
                notification['imageUrl'] = make_image_url_absolute(notification['imageUrl'])
            return jsonify(notification)
    finally:
        if conn:
            conn.close()

@app.route('/api/stores', methods=['GET', 'POST'])
def handle_stores():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                data = request.form
                image_url = data.get('imageUrl', '')
                if 'imageFile' in request.files and request.files['imageFile'].filename != '':
                    file = request.files['imageFile']
                    if file and allowed_file(file.filename):
                        filename = secure_filename(f"store_{uuid.uuid4()}_{file.filename}")
                        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                        image_url = f"/uploads/{filename}"
                sql = """INSERT INTO store_locations (name, address, city, phone, hours, mapEmbedUrl, imageUrl)
                         VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                values = (data.get('name'), data.get('address'), data.get('city'), data.get('phone'), data.get('hours'), data.get('mapEmbedUrl'), image_url)
                cursor.execute(sql, values)
                conn.commit()
                last_id = cursor.lastrowid
                cursor.execute("SELECT * FROM store_locations WHERE id = %s", (last_id,))
                new_store = cursor.fetchone()
                return jsonify(new_store), 201

            # GET all stores
            cursor.execute("SELECT * FROM store_locations")
            stores = cursor.fetchall()
            for s in stores:
                s['imageUrl'] = make_image_url_absolute(s['imageUrl'])
            return jsonify(stores)
    finally:
        if conn:
            conn.close()

@app.route('/api/stores/<int:store_id>', methods=['PUT', 'DELETE'])
def handle_store(store_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'PUT':
                data = request.form
                cursor.execute("SELECT imageUrl FROM store_locations WHERE id = %s", (store_id,))
                current_image = cursor.fetchone()['imageUrl']
                image_url = data.get('imageUrl', current_image)
                if 'imageFile' in request.files and request.files['imageFile'].filename != '':
                    file = request.files['imageFile']
                    if file and allowed_file(file.filename):
                        filename = secure_filename(f"store_{uuid.uuid4()}_{file.filename}")
                        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                        image_url = f"/uploads/{filename}"
                sql = """UPDATE store_locations SET name=%s, address=%s, city=%s, phone=%s, hours=%s, mapEmbedUrl=%s, imageUrl=%s
                         WHERE id=%s"""
                values = (data.get('name'), data.get('address'), data.get('city'), data.get('phone'), data.get('hours'), data.get('mapEmbedUrl'), image_url, store_id)
                cursor.execute(sql, values)
                conn.commit()
                cursor.execute("SELECT * FROM store_locations WHERE id = %s", (store_id,))
                updated_store = cursor.fetchone()
                return jsonify(updated_store)

            elif request.method == 'DELETE':
                cursor.execute("DELETE FROM store_locations WHERE id = %s", (store_id,))
                conn.commit()
                return jsonify({'message': 'Store deleted successfully'})
    finally:
        if conn:
            conn.close()


@app.route('/api/generate-invoice-docx', methods=['POST'])
def generate_invoice_docx():
    data = request.get_json()
    if not data or not data.get('customerName') or not data.get('items'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    customer_name = data['customerName']
    items = data['items']
    grand_total = 0
    invoice_items = []
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            for item_data in items:
                product_id = item_data.get('productId')
                quantity = int(item_data.get('quantity', 1))

                cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE", (product_id,))
                product = cursor.fetchone()

                if not product:
                    raise ValueError(f"Producto con ID {product_id} no encontrado.")
                if product['stock'] < quantity:
                    raise ValueError(f"Stock insuficiente para '{product['name']}'. Disponible: {product['stock']}, Solicitado: {quantity}.")

                new_stock = product['stock'] - quantity
                cursor.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, product_id))
                
                price = float(product['price'])
                discount_percent = int(product.get('discount', 0))
                discounted_price = price - (price * discount_percent / 100)
                subtotal = discounted_price * quantity
                grand_total += subtotal
                
                invoice_items.append({
                    "name": product['name'],
                    "quantity": quantity,
                    "unit_price": discounted_price,
                    "subtotal": subtotal
                })
        conn.commit()

    except (ValueError, pymysql.MySQLError) as e:
        conn.rollback()
        app.logger.error(f"Error processing invoice transaction: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

    try:
        invoice_number = f"INV-{int(datetime.now().timestamp())}"
        qr_url = "https://royal-fernet.vercel.app"
        qr_img = qrcode.make(qr_url)
        qr_io = io.BytesIO()
        qr_img.save(qr_io, 'PNG')
        qr_io.seek(0)

        document = Document()
        document.add_heading('Factura - Royal-Fernet', 0)
        p = document.add_paragraph()
        p.add_run('Vendedor: ').bold = True
        p.add_run('Royal-Fernet\n')
        p.add_run('Cliente: ').bold = True
        p.add_run(f'{customer_name}\n')
        p.add_run('Fecha: ').bold = True
        p.add_run(f'{datetime.now().strftime("%Y-%m-%d")}\n')
        p.add_run('Número de Factura: ').bold = True
        p.add_run(invoice_number)

        document.add_heading('Productos Comprados', level=1)
        table = document.add_table(rows=1, cols=4)
        table.style = 'Table Grid'
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = 'Producto'
        hdr_cells[1].text = 'Cantidad'
        hdr_cells[2].text = 'Precio Unitario'
        hdr_cells[3].text = 'Subtotal'

        for item in invoice_items:
            row_cells = table.add_row().cells
            row_cells[0].text = item['name']
            row_cells[1].text = str(item['quantity'])
            row_cells[2].text = format_colombian_pesos(item['unit_price'])
            row_cells[3].text = format_colombian_pesos(item['subtotal'])

        p_total = document.add_paragraph()
        p_total.alignment = 2 
        run_total_label = p_total.add_run('TOTAL A PAGAR: ')
        run_total_label.bold = True
        run_total_value = p_total.add_run(format_colombian_pesos(grand_total))
        run_total_value.bold = True

        document.add_heading('Detalles de la Tienda', level=1)
        document.add_paragraph('Escanea este código QR para visitar nuestra tienda online:')
        document.add_picture(qr_io, width=Inches(1.5))

        doc_io = io.BytesIO()
        document.save(doc_io)
        doc_io.seek(0)

        return send_file(
            doc_io,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=f'factura_{customer_name.replace(" ", "_")}.docx'
        )
    except Exception as e:
        app.logger.error(f"Error generating DOCX: {e}")
        return jsonify({'error': 'Failed to generate invoice document'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

