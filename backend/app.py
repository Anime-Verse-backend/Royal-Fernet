
import os
import uuid
import json
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
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

# --- App Initialization ---
load_dotenv()
app = Flask(__name__)

# --- CORS Configuration ---
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:9002')
CORS(app, resources={r"/api/*": {"origins": FRONTEND_URL, "supports_credentials": True}})

# --- SQLAlchemy Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Import models after db is initialized to avoid circular imports
from models import User, Product, Setting, Notification, StoreLocation

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

def process_image_paths(image_paths_json):
    if not image_paths_json:
        return []
    
    is_prod_env = os.getenv('API_BASE_URL') is not None
    
    try:
        image_paths = json.loads(image_paths_json) if isinstance(image_paths_json, str) else image_paths_json
        if is_prod_env:
            return [make_image_url_absolute(path) for path in image_paths if path]
        return [path for path in image_paths if path]
    except (json.JSONDecodeError, TypeError):
        app.logger.error(f"Could not parse images JSON: {image_paths_json}")
        return []

def format_colombian_pesos(amount):
    try:
        # Format without decimals, using dots for thousands
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
    new_user = User(name=data['name'], email=data['email'], password_hash=hashed_password, role='user')

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email already exists'}), 409
    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error on user registration: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        user = User.query.filter_by(email=data['email'], role='admin').first()
        if user and check_password_hash(user.password_hash, data['password']):
            return jsonify({'message': 'Login successful', 'user': {'name': user.name, 'email': user.email}}), 200
        else:
            return jsonify({'error': 'Invalid credentials or not an admin'}), 401
    except SQLAlchemyError as e:
        app.logger.error(f"Database error on login: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
    if request.method == 'POST':
        try:
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
            
            new_product = Product(
                id=str(uuid.uuid4()),
                name=request.form.get('name'),
                description=request.form.get('description'),
                category=request.form.get('category'),
                price=request.form.get('price'),
                discount=request.form.get('discount', 0),
                stock=request.form.get('stock', 100),
                images=json.dumps(image_paths),
                is_featured=request.form.get('isFeatured') == 'on'
            )
            db.session.add(new_product)
            db.session.commit()
            
            response_data = new_product.to_dict()
            response_data['images'] = process_image_paths(response_data['images'])
            return jsonify(response_data), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            app.logger.error(f"Error creating product: {e}")
            return jsonify({'error': 'Database error while creating product'}), 500
        except Exception as e:
            app.logger.error(f"Unexpected error creating product: {e}")
            return jsonify({'error': str(e)}), 500

    # --- GET Products ---
    try:
        query = request.args.get('q')
        if query:
            search_term = f"%{query}%"
            products_query = Product.query.filter(
                db.or_(Product.name.ilike(search_term), Product.category.ilike(search_term))
            )
        else:
            products_query = Product.query
        
        products = products_query.order_by(Product.created_at.desc()).all()
        products_list = []
        for p in products:
            p_dict = p.to_dict()
            p_dict['images'] = process_image_paths(p_dict['images'])
            products_list.append(p_dict)
        return jsonify(products_list)
    except SQLAlchemyError as e:
        app.logger.error(f"Database error fetching products: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/products/<string:product_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_product(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        if request.method == 'GET':
            product_dict = product.to_dict()
            product_dict['images'] = process_image_paths(product_dict['images'])
            return jsonify(product_dict)

        elif request.method == 'PUT':
            new_image_paths = []
            api_base_url = os.getenv('API_BASE_URL', request.host_url).rstrip('/')
            
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

            product.name = request.form.get('name', product.name)
            product.description = request.form.get('description', product.description)
            product.category = request.form.get('category', product.category)
            product.price = request.form.get('price', product.price)
            product.discount = request.form.get('discount', product.discount)
            product.stock = request.form.get('stock', product.stock)
            product.images = json.dumps(new_image_paths)
            product.is_featured = request.form.get('isFeatured') == 'on'
            
            db.session.commit()
            return jsonify({'message': 'Product updated successfully'})

        elif request.method == 'DELETE':
            db.session.delete(product)
            db.session.commit()
            return jsonify({'message': 'Product deleted'})

    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error on product {product_id}: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/admins', methods=['GET', 'POST'])
def handle_admins():
    if request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        hashed_password = generate_password_hash(data['password'])
        new_admin = User(name=data['name'], email=data['email'], password_hash=hashed_password, role='admin')
        
        try:
            db.session.add(new_admin)
            db.session.commit()
            return jsonify({'name': new_admin.name, 'email': new_admin.email}), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'Admin with that email already exists'}), 409
        except SQLAlchemyError as e:
            db.session.rollback()
            app.logger.error(f"Database error creating admin: {e}")
            return jsonify({'error': 'Database error'}), 500

    # GET Admins
    try:
        query = request.args.get('q')
        if query:
            search_term = f"%{query}%"
            admins_query = User.query.filter(
                User.role == 'admin',
                db.or_(User.name.ilike(search_term), User.email.ilike(search_term))
            )
        else:
            admins_query = User.query.filter_by(role='admin')
            
        admins = admins_query.all()
        return jsonify([{'id': a.id, 'name': a.name, 'email': a.email} for a in admins])
    except SQLAlchemyError as e:
        app.logger.error(f"Database error fetching admins: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/admins/<int:admin_id>', methods=['DELETE'])
def handle_admin(admin_id):
    try:
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({'error': 'Cannot delete the last administrator'}), 400

        user = User.query.filter_by(id=admin_id, role='admin').first()
        if not user:
            return jsonify({'error': 'Administrator not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'Administrator deleted successfully'})
    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error deleting admin: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    try:
        settings = Setting.query.get(1)
        if request.method == 'POST':
            if not settings:
                settings = Setting(id=1)
                db.session.add(settings)
            
            data = request.form
            
            # Handle Hero Images
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

            settings.heroImages = processed_hero_images
            settings.featuredCollectionTitle = data.get('featuredCollectionTitle', settings.featuredCollectionTitle)
            settings.featuredCollectionDescription = data.get('featuredCollectionDescription', settings.featuredCollectionDescription)
            settings.promoSectionTitle = data.get('promoSectionTitle', settings.promoSectionTitle)
            settings.promoSectionDescription = data.get('promoSectionDescription', settings.promoSectionDescription)
            settings.promoSectionVideoUrl = data.get('promoSectionVideoUrl', settings.promoSectionVideoUrl)
            settings.phone = data.get('phone', settings.phone)
            settings.contactEmail = data.get('contactEmail', settings.contactEmail)
            settings.twitterUrl = data.get('twitterUrl', settings.twitterUrl)
            settings.instagramUrl = data.get('instagramUrl', settings.instagramUrl)
            settings.facebookUrl = data.get('facebookUrl', settings.facebookUrl)

            db.session.commit()
            
            settings_dict = settings.to_dict()
            if settings_dict.get('heroImages'):
                for slide in settings_dict['heroImages']:
                    if slide.get('imageUrl'):
                        slide['imageUrl'] = make_image_url_absolute(slide['imageUrl'])
            return jsonify(settings_dict)

        # GET request
        if settings:
            settings_dict = settings.to_dict()
            if settings_dict.get('heroImages'):
                 for slide in settings_dict['heroImages']:
                    if slide.get('imageUrl'):
                        slide['imageUrl'] = make_image_url_absolute(slide['imageUrl'])
            return jsonify(settings_dict)
        return jsonify({}), 404
    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error on settings: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    
    new_notification = Notification(
        message=data['message'],
        imageUrl=data.get('imageUrl'),
        linkUrl=data.get('linkUrl')
    )
    try:
        db.session.add(new_notification)
        db.session.commit()
        return jsonify({'message': 'Notification created'}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error creating notification: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/notifications/latest', methods=['GET'])
def get_latest_notification():
    try:
        notification = Notification.query.order_by(Notification.created_at.desc()).first()
        if not notification:
            return jsonify({'error': 'No notifications found'}), 404
            
        notification_dict = notification.to_dict()
        if notification_dict.get('imageUrl'):
            notification_dict['imageUrl'] = make_image_url_absolute(notification_dict['imageUrl'])
        return jsonify(notification_dict)
    except SQLAlchemyError as e:
        app.logger.error(f"Database error fetching latest notification: {e}")
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/stores', methods=['GET', 'POST'])
def handle_stores():
    if request.method == 'POST':
        try:
            data = request.form
            new_store = StoreLocation(
                name=data.get('name'),
                address=data.get('address'),
                city=data.get('city'),
                phone=data.get('phone'),
                hours=data.get('hours'),
                mapEmbedUrl=data.get('mapEmbedUrl')
            )
            if 'imageFile' in request.files and request.files['imageFile'].filename != '':
                file = request.files['imageFile']
                if file and allowed_file(file.filename):
                    filename = secure_filename(f"store_{uuid.uuid4()}_{file.filename}")
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    new_store.imageUrl = f"/uploads/{filename}"
            elif data.get('imageUrl'):
                new_store.imageUrl = data.get('imageUrl')

            db.session.add(new_store)
            db.session.commit()
            return jsonify(new_store.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error creating store: {e}")
            return jsonify({'error': str(e)}), 500
    
    # GET all stores
    stores = StoreLocation.query.all()
    stores_list = []
    for s in stores:
        s_dict = s.to_dict()
        s_dict['imageUrl'] = make_image_url_absolute(s_dict['imageUrl'])
        stores_list.append(s_dict)
    return jsonify(stores_list)


@app.route('/api/stores/<int:store_id>', methods=['PUT', 'DELETE'])
def handle_store(store_id):
    store = StoreLocation.query.get_or_404(store_id)
    if request.method == 'PUT':
        try:
            data = request.form
            store.name = data.get('name', store.name)
            store.address = data.get('address', store.address)
            store.city = data.get('city', store.city)
            store.phone = data.get('phone', store.phone)
            store.hours = data.get('hours', store.hours)
            store.mapEmbedUrl = data.get('mapEmbedUrl', store.mapEmbedUrl)
            
            if 'imageFile' in request.files and request.files['imageFile'].filename != '':
                file = request.files['imageFile']
                if file and allowed_file(file.filename):
                    filename = secure_filename(f"store_{uuid.uuid4()}_{file.filename}")
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    store.imageUrl = f"/uploads/{filename}"
            elif data.get('imageUrl'):
                store.imageUrl = data.get('imageUrl')

            db.session.commit()
            return jsonify(store.to_dict())
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating store: {e}")
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'DELETE':
        db.session.delete(store)
        db.session.commit()
        return jsonify({'message': 'Store deleted successfully'})


@app.route('/api/generate-invoice-docx', methods=['POST'])
def generate_invoice_docx():
    data = request.get_json()
    if not data or not data.get('customerName') or not data.get('items'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    customer_name = data['customerName']
    items = data['items']
    grand_total = 0
    invoice_items = []
    
    try:
        with db.session.begin_nested():
            for item_data in items:
                product_id = item_data.get('productId')
                quantity = int(item_data.get('quantity', 1))

                product = Product.query.with_for_update().get(product_id)

                if not product:
                    raise ValueError(f"Producto con ID {product_id} no encontrado.")
                if product.stock < quantity:
                    raise ValueError(f"Stock insuficiente para '{product.name}'. Disponible: {product.stock}, Solicitado: {quantity}.")

                product.stock -= quantity
                
                price = float(product.price)
                discount_percent = int(product.discount or 0)
                discounted_price = price - (price * discount_percent / 100)
                subtotal = discounted_price * quantity
                grand_total += subtotal
                
                invoice_items.append({
                    "name": product.name,
                    "quantity": quantity,
                    "unit_price": discounted_price,
                    "subtotal": subtotal
                })
        db.session.commit()

    except (ValueError, SQLAlchemyError) as e:
        db.session.rollback()
        app.logger.error(f"Error processing invoice transaction: {e}")
        return jsonify({'error': str(e)}), 500
    
    # --- Generate DOCX ---
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
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
