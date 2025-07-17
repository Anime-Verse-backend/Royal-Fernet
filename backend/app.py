
import os
import uuid
import json
import pymysql
import io
import qrcode
from docx import Document
from docx.shared import Inches
from flask import send_file, send_from_directory
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import locale

# --- App Initialization ---
load_dotenv()
app = Flask(__name__)

# --- CORS Configuration ---
# Load the frontend URL from environment variables.
# For local development, it will fall back to the default Next.js port.
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:9002')
CORS(app, resources={r"/api/*": {"origins": FRONTEND_URL}})


# Set locale for currency formatting
try:
    locale.setlocale(locale.LC_ALL, 'es_CO.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_ALL, 'Spanish_Colombia.1252')
    except locale.Error:
        print("Warning: Colombian locale not found. Using default for currency formatting.")

# --- File Upload Configuration ---
# Use an absolute path for the upload folder to ensure reliability
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Database Connection Helper ---
def get_db_connection():
    """
    Establishes a connection to the MySQL database.
    It uses environment variables for configuration.
    """
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT')),
            ssl_verify_cert=False,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except pymysql.MySQLError as e:
        app.logger.error(f"Error connecting to MySQL: {e}")
        return None

# --- URL Helper ---
def make_image_url_absolute(base_url, path):
    """Checks if a path is already absolute, otherwise prepends the base_url."""
    if not path or path.startswith(('http://', 'https://')):
        return path
    # In production, the base_url for uploads will come from an env var.
    # The request.host_url is not reliable behind proxies like Render's.
    api_base = os.getenv('API_BASE_URL', request.host_url)
    return f"{api_base.rstrip('/')}{path}"

# --- API Routes ---

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (name, email, hashed_password, 'user'))
        conn.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except pymysql.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM users WHERE email = %s AND role = 'admin'"
            cursor.execute(sql, (email,))
            user = cursor.fetchone()

            if user and check_password_hash(user['password_hash'], password):
                return jsonify({'message': 'Login successful', 'user': {'name': user['name'], 'email': user['email']}}), 200
            else:
                return jsonify({'error': 'Invalid credentials or not an admin'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
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
                elif request.form.get(url_key) and request.form.get(url_key).strip():
                    image_paths.append(request.form.get(url_key))

            product = {
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
                cursor.execute(sql, tuple(product.values()))
            conn.commit()
            
            product_response = product.copy()
            product_response['images'] = image_paths 
            return jsonify(product_response), 201
        
        # --- GET request ---
        query = request.args.get('q')
        with conn.cursor() as cursor:
            if query:
                sql = "SELECT * FROM products WHERE name LIKE %s OR category LIKE %s"
                search_term = f"%{query}%"
                cursor.execute(sql, (search_term, search_term))
            else:
                cursor.execute("SELECT * FROM products")
            products = cursor.fetchall()
            base_url = os.getenv('API_BASE_URL', request.host_url)
            for product in products:
                product_images = []
                if 'images' in product and isinstance(product['images'], str):
                    try:
                        image_paths = json.loads(product['images'])
                        valid_paths = [p for p in image_paths if p]
                        product_images = [make_image_url_absolute(base_url, path) for path in valid_paths]
                    except (json.JSONDecodeError, TypeError):
                        pass 
                product['images'] = product_images
            return jsonify(products)
    except Exception as e:
        app.logger.error(f"Error handling products: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
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
                    base_url = os.getenv('API_BASE_URL', request.host_url)
                    product_images = []
                    if 'images' in product and isinstance(product['images'], str):
                        try:
                            image_paths = json.loads(product['images'])
                            valid_paths = [p for p in image_paths if p]
                            product_images = [make_image_url_absolute(base_url, path) for path in valid_paths]
                        except (json.JSONDecodeError, TypeError):
                            pass
                    product['images'] = product_images
                    return jsonify(product)
                return jsonify({'error': 'Product not found'}), 404

            elif request.method == 'PUT':
                new_image_paths = []
                api_base_url = os.getenv('API_BASE_URL', request.host_url).rstrip('/')
                
                for i in range(1, 5):
                    file_key = f'image{i}'
                    url_key = f'imageUrl{i}'
                    
                    if file_key in request.files and request.files[file_key].filename != '':
                        file = request.files[file_key]
                        if file and allowed_file(file.filename):
                            filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
                            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                            new_image_paths.append(f"/uploads/{filename}")
                    elif request.form.get(url_key) and request.form.get(url_key).strip():
                        existing_full_url = request.form.get(url_key)
                        if existing_full_url.startswith(api_base_url):
                            relative_path = existing_full_url.replace(api_base_url, '', 1)
                            new_image_paths.append(relative_path)
                        else:
                            new_image_paths.append(existing_full_url)

                sql = """UPDATE products SET name=%s, description=%s, category=%s, price=%s, discount=%s, stock=%s, images=%s, is_featured=%s
                         WHERE id=%s"""
                values = (
                    request.form.get('name'), request.form.get('description'), request.form.get('category'),
                    request.form.get('price'), request.form.get('discount', 0), request.form.get('stock'), 
                    json.dumps(new_image_paths),
                    request.form.get('isFeatured') == 'on', product_id
                )
                cursor.execute(sql, values)
                conn.commit()
                return jsonify({'message': 'Product updated successfully'}), 200

            elif request.method == 'DELETE':
                cursor.execute("SELECT images FROM products WHERE id = %s", (product_id,))
                result = cursor.fetchone()
                if result and result['images']:
                    image_paths = json.loads(result['images'])
                    for path in image_paths:
                        if path and path.startswith('/uploads/'):
                            try:
                                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], path.split('/')[-1]))
                            except OSError as e:
                                app.logger.error(f"Error deleting file {path}: {e}")
                
                rows_affected = cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
                if rows_affected == 0:
                    return jsonify({'error': 'Product not found'}), 404
                conn.commit()
                return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/admins', methods=['GET', 'POST'])
def handle_admins():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                data = request.get_json()
                hashed_password = generate_password_hash(data['password'])
                sql = "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, 'admin')"
                cursor.execute(sql, (data['name'], data['email'], hashed_password))
                conn.commit()
                return jsonify({'name': data['name'], 'email': data['email']}), 201

            query = request.args.get('q')
            sql = "SELECT id, name, email FROM users WHERE role = 'admin'"
            params = []
            if query:
                sql += " AND (name LIKE %s OR email LIKE %s)"
                search_term = f"%{query}%"
                params.extend([search_term, search_term])
            
            cursor.execute(sql, params)
            admins = cursor.fetchall()
            return jsonify(admins)
    except pymysql.IntegrityError:
        return jsonify({'error': 'Admin with that email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/admins/<int:admin_id>', methods=['DELETE'])
def handle_admin(admin_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            # Prevent deleting the last admin for safety
            cursor.execute("SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'")
            count = cursor.fetchone()['admin_count']
            if count <= 1:
                return jsonify({'error': 'Cannot delete the last administrator'}), 400

            rows_affected = cursor.execute("DELETE FROM users WHERE id = %s AND role = 'admin'", (admin_id,))
            if rows_affected == 0:
                return jsonify({'error': 'Administrator not found'}), 404
            
            conn.commit()
            return jsonify({'message': 'Administrator deleted successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error deleting admin: {e}")
        return jsonify({'error': str(e)}), 500
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
                data = request.form.to_dict()
                
                if 'mainImageFile' in request.files and request.files['mainImageFile'].filename != '':
                    file = request.files['mainImageFile']
                    if file and allowed_file(file.filename):
                        filename = secure_filename(f"setting_{uuid.uuid4()}_{file.filename}")
                        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                        data['mainImageUrl'] = f"/uploads/{filename}"
                
                sql = """INSERT INTO settings (id, heroHeadline, heroSubheadline, heroButtonText, mainImageUrl, 
                                            featuredCollectionTitle, featuredCollectionDescription, promoSectionTitle, promoSectionDescription, promoSectionVideoUrl, 
                                            locationSectionTitle, address, hours, mapEmbedUrl, 
                                            phone, contactEmail, twitterUrl, instagramUrl, facebookUrl)
                         VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                         ON DUPLICATE KEY UPDATE
                         heroHeadline=VALUES(heroHeadline), heroSubheadline=VALUES(heroSubheadline), 
                         heroButtonText=VALUES(heroButtonText), mainImageUrl=VALUES(mainImageUrl),
                         featuredCollectionTitle=VALUES(featuredCollectionTitle), featuredCollectionDescription=VALUES(featuredCollectionDescription),
                         promoSectionTitle=VALUES(promoSectionTitle), promoSectionDescription=VALUES(promoSectionDescription), promoSectionVideoUrl=VALUES(promoSectionVideoUrl),
                         locationSectionTitle=VALUES(locationSectionTitle),
                         address=VALUES(address), hours=VALUES(hours), mapEmbedUrl=VALUES(mapEmbedUrl),
                         phone=VALUES(phone), contactEmail=VALUES(contactEmail), twitterUrl=VALUES(twitterUrl),
                         instagramUrl=VALUES(instagramUrl), facebookUrl=VALUES(facebookUrl)"""
                values = (
                    data.get('heroHeadline'), data.get('heroSubheadline'), data.get('heroButtonText'),
                    data.get('mainImageUrl'), data.get('featuredCollectionTitle'), data.get('featuredCollectionDescription'),
                    data.get('promoSectionTitle'), data.get('promoSectionDescription'), data.get('promoSectionVideoUrl'),
                    data.get('locationSectionTitle'), data.get('address'), data.get('hours'), data.get('mapEmbedUrl'),
                    data.get('phone'), data.get('contactEmail'), data.get('twitterUrl'),
                    data.get('instagramUrl'), data.get('facebookUrl')
                )
                cursor.execute(sql, values)
                conn.commit()

                cursor.execute("SELECT * FROM settings WHERE id = 1")
                settings = cursor.fetchone()
                if settings:
                    base_url = os.getenv('API_BASE_URL', request.host_url)
                    if settings.get('mainImageUrl'):
                        settings['mainImageUrl'] = make_image_url_absolute(base_url, settings.get('mainImageUrl'))
                    return jsonify(settings)
                return jsonify(data), 200

            cursor.execute("""SELECT heroHeadline, heroSubheadline, heroButtonText, mainImageUrl, 
                                     featuredCollectionTitle, featuredCollectionDescription, promoSectionTitle, promoSectionDescription, promoSectionVideoUrl,
                                     locationSectionTitle, address, hours, mapEmbedUrl, 
                                     phone, contactEmail, twitterUrl, instagramUrl, facebookUrl 
                              FROM settings WHERE id = 1""")
            settings = cursor.fetchone()
            if settings:
                base_url = os.getenv('API_BASE_URL', request.host_url)
                if settings.get('mainImageUrl'):
                    settings['mainImageUrl'] = make_image_url_absolute(base_url, settings['mainImageUrl'])
                return jsonify(settings)
            return jsonify({}), 404 
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.get_json()
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO notifications (message, imageUrl, linkUrl) VALUES (%s, %s, %s)"
            cursor.execute(sql, (data.get('message'), data.get('imageUrl'), data.get('linkUrl')))
            conn.commit()
            return jsonify({'message': 'Notification created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/notifications/latest', methods=['GET'])
def get_latest_notification():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1")
            notification = cursor.fetchone()
            if notification:
                return jsonify(notification)
            return jsonify({'error': 'No notifications found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/generate-invoice-docx', methods=['POST'])
def generate_invoice_docx():
    data = request.get_json()
    customer_name = data.get('customerName')
    items = data.get('items') # Expects a list of {productId, quantity}

    if not all([customer_name, items]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        grand_total = 0
        invoice_items = []

        with conn.cursor() as cursor:
            conn.begin()

            for item in items:
                product_id = item.get('productId')
                quantity = int(item.get('quantity', 1))

                cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE", (product_id,))
                product = cursor.fetchone()

                if not product:
                    raise Exception(f"Producto con ID {product_id} no encontrado.")

                if product['stock'] < quantity:
                    raise Exception(f"Stock insuficiente para '{product['name']}'. Disponible: {product['stock']}, Solicitado: {quantity}.")

                new_stock = product['stock'] - quantity
                cursor.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, product_id))

                price = float(product['price'])
                discount_percent = int(product['discount'])
                discount_amount = (price * discount_percent) / 100
                discounted_price = price - discount_amount
                subtotal = discounted_price * quantity
                grand_total += subtotal
                
                invoice_items.append({
                    "name": product['name'],
                    "quantity": quantity,
                    "unit_price": discounted_price,
                    "subtotal": subtotal
                })
        
            conn.commit()

        invoice_number = f"INV-{int(datetime.now().timestamp())}"
        
        qr_url = os.getenv('FRONTEND_URL', request.host_url)
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
            row_cells[2].text = locale.currency(item['unit_price'], grouping=True)
            row_cells[3].text = locale.currency(item['subtotal'], grouping=True)

        p_total = document.add_paragraph()
        p_total.alignment = 2 
        run_total_label = p_total.add_run('TOTAL A PAGAR: ')
        run_total_label.bold = True
        run_total_value = p_total.add_run(locale.currency(grand_total, grouping=True))
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
        if conn:
            conn.rollback() 
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()
