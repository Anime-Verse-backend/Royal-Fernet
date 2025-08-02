
import os
import uuid
import json
import psycopg2
import psycopg2.extras
import io
import qrcode
import logging
import base64
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
logging.basicConfig(level=logging.INFO)

# --- CORS Configuration ---
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:9002')
CORS(app, resources={r"/*": {"origins": [FRONTEND_URL, "http://localhost:9002"], "supports_credentials": True}})

# --- Database Connection Helper ---
def get_db_connection():
    try:
        # Render provides the DATABASE_URL env var.
        conn_string = os.getenv('DATABASE_URL')
        if not conn_string:
            raise ValueError("DATABASE_URL environment variable is not set.")
        
        connection = psycopg2.connect(conn_string)
        app.logger.info("Successfully connected to the PostgreSQL database.")
        return connection
    except psycopg2.Error as e:
        app.logger.error(f"Error connecting to PostgreSQL database: {e}")
        return None

# --- File Upload Configuration (No longer saves to disk) ---
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Helper Functions ---
def file_to_data_uri(file):
    """Converts a file stream to a Data URI."""
    if not file or not file.filename:
        return None
    
    if allowed_file(file.filename):
        try:
            encoded_string = base64.b64encode(file.read()).decode('utf-8')
            mime_type = file.mimetype
            return f"data:{mime_type};base64,{encoded_string}"
        except Exception as e:
            app.logger.error(f"Could not convert file to Data URI: {e}")
            return None
    return None

# --- API Routes ---

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
    except psycopg2.IntegrityError:
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
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
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
            image_uris = []
            for i in range(1, 5):
                file_key = f'image{i}'
                url_key = f'imageUrl{i}'

                # Prioritize file upload
                if file_key in request.files and request.files[file_key].filename:
                    file = request.files[file_key]
                    data_uri = file_to_data_uri(file)
                    if data_uri:
                        image_uris.append(data_uri)
                # Fallback to URL if provided
                elif request.form.get(url_key):
                    image_uris.append(request.form.get(url_key))
            
            product_data = {
                'id': str(uuid.uuid4()),
                'name': request.form.get('name'),
                'description': request.form.get('description'),
                'category': request.form.get('category'),
                'price': request.form.get('price'),
                'discount': request.form.get('discount', 0),
                'stock': request.form.get('stock', 100),
                'images': json.dumps(image_uris),
                'is_featured': request.form.get('isFeatured') == 'on'
            }
            with conn.cursor() as cursor:
                sql = """INSERT INTO products (id, name, description, category, price, discount, stock, images, is_featured) 
                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                cursor.execute(sql, tuple(product_data.values()))
            conn.commit()
            return jsonify(product_data), 201
        
        # GET Products
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            query = request.args.get('q')
            if query:
                search_term = f"%{query}%"
                sql = "SELECT * FROM products WHERE name ILIKE %s OR category ILIKE %s ORDER BY created_at DESC"
                cursor.execute(sql, (search_term, search_term))
            else:
                sql = "SELECT * FROM products ORDER BY created_at DESC"
                cursor.execute(sql)
            
            products = [dict(row) for row in cursor.fetchall()]
            return jsonify(products)
    finally:
        if conn:
            conn.close()

@app.route('/api/products/<string:product_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_product(product_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            if request.method == 'GET':
                cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
                product = cursor.fetchone()
                if product:
                    return jsonify(dict(product))
                return jsonify({'error': 'Product not found'}), 404
            
            elif request.method == 'PUT':
                new_image_uris = []
                for i in range(1, 5):
                    file_key = f'image{i}'
                    url_key = f'imageUrl{i}'

                    # Prioritize new file upload
                    if file_key in request.files and request.files[file_key].filename:
                        file = request.files[file_key]
                        data_uri = file_to_data_uri(file)
                        if data_uri:
                            new_image_uris.append(data_uri)
                    # Fallback to existing URL
                    elif request.form.get(url_key):
                        new_image_uris.append(request.form.get(url_key))
                
                sql = """UPDATE products SET name=%s, description=%s, category=%s, price=%s, discount=%s, stock=%s, images=%s, is_featured=%s
                         WHERE id=%s"""
                values = (
                    request.form.get('name'), request.form.get('description'), request.form.get('category'),
                    request.form.get('price'), request.form.get('discount', 0), request.form.get('stock', 100),
                    json.dumps(new_image_uris), request.form.get('isFeatured') == 'on', product_id
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
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
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
                sql += " AND (name ILIKE %s OR email ILIKE %s)"
                cursor.execute(sql, (f"%{query}%", f"%{query}%"))
            else:
                cursor.execute(sql)
            admins = [dict(row) for row in cursor.fetchall()]
            return jsonify(admins)
    except psycopg2.IntegrityError:
        return jsonify({'error': 'Admin with that email already exists'}), 409
    finally:
        if conn:
            conn.close()

@app.route('/api/admins/<int:admin_id>', methods=['DELETE'])
def handle_admin(admin_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
            admin_count = cursor.fetchone()['count']
            if admin_count <= 1:
                return jsonify({'error': 'Cannot delete the last administrator'}), 400
            
            cursor.execute("DELETE FROM users WHERE id = %s AND role = 'admin'", (admin_id,))
            rows_affected = cursor.rowcount
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
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            if request.method == 'POST':
                hero_images_json = request.form.get('heroImages', '[]')
                hero_images_data = json.loads(hero_images_json)
                processed_hero_images = []

                for index, slide in enumerate(hero_images_data):
                    if not isinstance(slide, dict): continue

                    # Create a copy to modify
                    processed_slide = slide.copy()

                    # Check for new file upload first
                    file_key = f'heroImageFile_{index}'
                    if file_key in request.files and request.files[file_key].filename:
                        file = request.files[file_key]
                        data_uri = file_to_data_uri(file)
                        if data_uri:
                            processed_slide['imageUrl'] = data_uri
                    
                    # If no file, use the URL from the hidden input (which is already in the slide object)
                    # No extra step needed here, if no file is uploaded, the existing imageUrl is preserved.
                    
                    processed_hero_images.append(processed_slide)

                sql = """INSERT INTO settings (id, hero_images, featured_collection_title, featured_collection_description, promo_section_title, promo_section_description, promo_section_video_url, phone, contact_email, twitter_url, instagram_url, facebook_url)
                         VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                         ON CONFLICT (id) DO UPDATE SET
                         hero_images = EXCLUDED.hero_images,
                         featured_collection_title = EXCLUDED.featured_collection_title,
                         featured_collection_description = EXCLUDED.featured_collection_description,
                         promo_section_title = EXCLUDED.promo_section_title,
                         promo_section_description = EXCLUDED.promo_section_description,
                         promo_section_video_url = EXCLUDED.promo_section_video_url,
                         phone = EXCLUDED.phone,
                         contact_email = EXCLUDED.contact_email,
                         twitter_url = EXCLUDED.twitter_url,
                         instagram_url = EXCLUDED.instagram_url,
                         facebook_url = EXCLUDED.facebook_url
                         RETURNING *"""
                values = (
                    json.dumps(processed_hero_images), request.form.get('featuredCollectionTitle'), request.form.get('featuredCollectionDescription'),
                    request.form.get('promoSectionTitle'), request.form.get('promoSectionDescription'), request.form.get('promoSectionVideoUrl'),
                    request.form.get('phone'), request.form.get('contactEmail'), request.form.get('twitterUrl'), request.form.get('instagramUrl'), request.form.get('facebookUrl')
                )
                cursor.execute(sql, values)
                settings = dict(cursor.fetchone())
                conn.commit()
                return jsonify(settings)
            
            # GET request
            cursor.execute("SELECT * FROM settings WHERE id = 1")
            settings = cursor.fetchone()
            if settings:
                return jsonify(dict(settings))
            return jsonify({}), 404
    except Exception as e:
        app.logger.error(f"Error in handle_settings: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.get_json()
    if not data or 'message' not in data or 'title' not in data:
        return jsonify({'error': 'Title and message are required'}), 400
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO notifications (title, message, image_url, link_url) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (data.get('title'), data['message'], data.get('image_url'), data.get('link_url')))
        conn.commit()
        return jsonify({'message': 'Notification created'}), 201
    except Exception as e:
        app.logger.error(f"Error creating notification: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/notifications/latest', methods=['GET'])
def get_latest_notification():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1")
            notification = cursor.fetchone()
            if not notification:
                return jsonify({'error': 'No notifications found'}), 404
            return jsonify(dict(notification))
    finally:
        if conn:
            conn.close()

@app.route('/api/stores', methods=['GET', 'POST'])
def handle_stores():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            if request.method == 'POST':
                data = request.form
                image_url = '' # Start with empty image
                if 'imageFile' in request.files and request.files['imageFile'].filename:
                    file = request.files['imageFile']
                    data_uri = file_to_data_uri(file)
                    if data_uri:
                        image_url = data_uri
                
                sql = """INSERT INTO store_locations (name, address, city, phone, hours, map_embed_url, image_url)
                         VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *"""
                values = (data.get('name'), data.get('address'), data.get('city'), data.get('phone'), data.get('hours'), data.get('mapEmbedUrl'), image_url)
                cursor.execute(sql, values)
                new_store = dict(cursor.fetchone())
                conn.commit()
                return jsonify(new_store), 201

            # GET all stores
            cursor.execute("SELECT * FROM store_locations ORDER BY id")
            stores = [dict(row) for row in cursor.fetchall()]
            return jsonify(stores)
    finally:
        if conn:
            conn.close()

@app.route('/api/stores/<int:store_id>', methods=['PUT', 'DELETE'])
def handle_store(store_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            if request.method == 'PUT':
                data = request.form
                cursor.execute("SELECT image_url FROM store_locations WHERE id = %s", (store_id,))
                current_image_res = cursor.fetchone()
                image_url = current_image_res['image_url'] if current_image_res else ''

                if 'imageFile' in request.files and request.files['imageFile'].filename:
                    file = request.files['imageFile']
                    data_uri = file_to_data_uri(file)
                    if data_uri:
                        image_url = data_uri
                
                sql = """UPDATE store_locations SET name=%s, address=%s, city=%s, phone=%s, hours=%s, map_embed_url=%s, image_url=%s
                         WHERE id=%s RETURNING *"""
                values = (data.get('name'), data.get('address'), data.get('city'), data.get('phone'), data.get('hours'), data.get('mapEmbedUrl'), image_url, store_id)
                cursor.execute(sql, values)
                updated_store = dict(cursor.fetchone())
                conn.commit()
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
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
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

    except (ValueError, psycopg2.Error) as e:
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
            row_cells[2].text = f"${int(item['unit_price']):,}".replace(",", ".")
            row_cells[3].text = f"${int(item['subtotal']):,}".replace(",", ".")

        p_total = document.add_paragraph()
        p_total.alignment = 2 
        run_total_label = p_total.add_run('TOTAL A PAGAR: ')
        run_total_label.bold = True
        run_total_value = p_total.add_run(f"${int(grand_total):,}".replace(",", "."))
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

# --- Database Viewer Endpoints ---

@app.route('/api/db/tables', methods=['GET'])
def get_db_tables():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            return jsonify(tables)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/db/tables/<string:table_name>', methods=['GET'])
def get_table_content(table_name):
    if not table_name.replace('_', '').isalnum():
        return jsonify({'error': 'Invalid table name'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            from psycopg2 import sql
            query = sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
            cursor.execute(query)
            
            rows = [dict(row) for row in cursor.fetchall()]
            
            def json_converter(o):
                if isinstance(o, datetime):
                    return o.isoformat()
                return str(o)
            
            for row in rows:
                for key, value in row.items():
                    row[key] = json_converter(value)
                    
            return jsonify(rows)
            
    except Exception as e:
        return jsonify({'error': f"Could not fetch table '{table_name}': {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

    