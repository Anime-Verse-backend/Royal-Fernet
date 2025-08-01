
import os
import pymysql
import json
import uuid
import logging
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()
logging.basicConfig(level=logging.INFO)

# --- Database Connection ---
def get_db_connection():
    ssl_args = {}
    # Render's path for secret files
    render_ca_path = '/etc/secrets/ca.pem'

    if os.path.exists(render_ca_path):
        logging.info("Found Render SSL certificate for init_db, using it for connection.")
        ssl_args['ssl_ca'] = render_ca_path
        ssl_args['ssl_verify_cert'] = True
    else:
        logging.warning("No SSL certificate found at /etc/secrets/ca.pem for init_db. Connection may fail if SSL is required.")

    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=20,
            **ssl_args
        )
        return connection
    except pymysql.MySQLError as e:
        logging.error(f"Error connecting to MySQL server in init_db: {e}")
        exit(1)

def initialize_database():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            db_name = os.getenv('DB_NAME')
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute(f"USE `{db_name}`")
            print(f"✅ Database '{db_name}' is ready.")

            # --- Table Creation ---
            tables = {
                "users": """
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password_hash VARCHAR(255) NOT NULL,
                        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "products": """
                    CREATE TABLE IF NOT EXISTS products (
                        id VARCHAR(36) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT NOT NULL,
                        category VARCHAR(255) NOT NULL,
                        price DECIMAL(10, 2) NOT NULL,
                        discount INT DEFAULT 0,
                        stock INT NOT NULL DEFAULT 100,
                        images JSON NOT NULL,
                        is_featured BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "settings": """
                    CREATE TABLE IF NOT EXISTS settings (
                        id INT PRIMARY KEY DEFAULT 1,
                        heroImages JSON,
                        featuredCollectionTitle VARCHAR(255),
                        featuredCollectionDescription TEXT,
                        promoSectionTitle VARCHAR(255),
                        promoSectionDescription TEXT,
                        promoSectionVideoUrl VARCHAR(2048),
                        phone VARCHAR(255),
                        contactEmail VARCHAR(255),
                        twitterUrl VARCHAR(2048),
                        instagramUrl VARCHAR(2048),
                        facebookUrl VARCHAR(2048),
                        CONSTRAINT single_row CHECK (id = 1)
                    )
                """,
                "notifications": """
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        message TEXT NOT NULL,
                        imageUrl VARCHAR(2048),
                        linkUrl VARCHAR(2048),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "store_locations": """
                    CREATE TABLE IF NOT EXISTS store_locations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        address VARCHAR(255) NOT NULL,
                        city VARCHAR(100) NOT NULL,
                        phone VARCHAR(50) NOT NULL,
                        hours VARCHAR(255) NOT NULL,
                        mapEmbedUrl TEXT NOT NULL,
                        imageUrl VARCHAR(2048) NOT NULL
                    )
                """
            }
            
            for table_name, create_statement in tables.items():
                cursor.execute(create_statement)
                print(f"✅ Table '{table_name}' created or already exists.")
            
            conn.commit()
            print("\n🎉 Database schema initialization complete!")

    finally:
        if conn:
            conn.close()

def seed_data():
    conn = get_db_connection()
    db_name = os.getenv('DB_NAME')
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"USE `{db_name}`")
            print("\n🌱 Seeding database with initial data (if needed)...")

            # Seed Admin User
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE email = %s", ('admin@royalfernet.com',))
            if cursor.fetchone()['count'] == 0:
                hashed_password = generate_password_hash('adminpass')
                cursor.execute("INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, 'admin')", 
                               ('Admin User', 'admin@royalfernet.com', hashed_password))
                print("   - Default admin user created (admin@royalfernet.com / adminpass).")

            # Seed Products
            cursor.execute("SELECT COUNT(*) as count FROM products")
            if cursor.fetchone()['count'] == 0:
                products_to_seed = [
                    (str(uuid.uuid4()), "Elegance Chrono", "Un reloj clásico con un toque moderno.", "Clásico", 450000, 10, 50, json.dumps(["https://th.bing.com/th/id/OIG2.uL7ZzE5A2V_DcyEALC4b?pid=ImgGn"]), True),
                    (str(uuid.uuid4()), "Sportive GT", "Diseñado para el aventurero urbano.", "Deportivo", 320000, 0, 75, json.dumps(["https://th.bing.com/th/id/OIG3.bEwXfzw9L2.fS3z4n.sS?pid=ImgGn"]), True),
                    (str(uuid.uuid4()), "Midnight Sapphire", "Lujo y sofisticación en tu muñeca.", "Lujo", 750000, 15, 30, json.dumps(["https://th.bing.com/th/id/OIG1.e9aR3vS.iYfLDCcGgrjH?pid=ImgGn"]), True),
                    (str(uuid.uuid4()), "Aura Minimalist", "Diseño simple, limpio y elegante.", "Minimalista", 280000, 0, 100, json.dumps(["https://th.bing.com/th/id/OIG2.g8z6IqP2_3O9RzY4F1qQ?pid=ImgGn"]), False)
                ]
                insert_query = "INSERT INTO products (id, name, description, category, price, discount, stock, images, is_featured) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
                cursor.executemany(insert_query, products_to_seed)
                print(f"   - Seeded {len(products_to_seed)} products.")

            # Seed Settings
            cursor.execute("SELECT COUNT(*) as count FROM settings WHERE id = 1")
            if cursor.fetchone()['count'] == 0:
                hero_images = json.dumps([
                    {"id": "slide1", "headline": "Elegancia Atemporal", "subheadline": "Descubre nuestra colección exclusiva.", "buttonText": "Explorar", "imageUrl": "https://site-2206080.mozfiles.com/files/WhatsApp%20Image%202024-07-16%20at%2011.45.24.jpeg"},
                    {"id": "slide2", "headline": "Innovación en Cada Segundo", "subheadline": "Nuevos modelos con tecnología de punta.", "buttonText": "Ver Novedades", "imageUrl": "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"}
                ])
                sql = """INSERT INTO settings (id, heroImages, featuredCollectionTitle, featuredCollectionDescription, promoSectionTitle, promoSectionDescription, promoSectionVideoUrl, phone, contactEmail, twitterUrl, instagramUrl, facebookUrl)
                         VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                values = (hero_images, "COLECCIÓN ROYAL SERIES", "Relojes para quienes valoran la distinción.", "ROYAL DELUXE", "Descubre la elegancia y la innovación.", "https://www.youtube.com/embed/dQw4w9WgXcQ", "+15551234567", "contacto@royalfernet.com", "#", "#", "#")
                cursor.execute(sql, values)
                print("   - Default store settings inserted.")
            
            # Seed Store Locations
            cursor.execute("SELECT COUNT(*) as count FROM store_locations")
            if cursor.fetchone()['count'] == 0:
                locations_to_seed = [
                    ('Boutique Principal - El Tesoro', 'Carrera 25A # 1A Sur-45', 'Medellín, Antioquia', '(604) 123 4567', 'L-S: 10am-9pm', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.339668489869!2d-75.56821218898139!3d6.219085093754988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e44282dd3832d61%3A0x47b96e19a41c6e2a!2sParque%20Comercial%20El%20Tesoro!5e0!3m2!1sen!2sco!4v1721938978130!5m2!1sen!2sco', 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
                    ('Tienda de Lujo - Andino', 'Carrera 11 # 82-71', 'Bogotá, Cundinamarca', '(601) 765 4321', 'L-S: 10am-8pm', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.6215392769417!2d-74.05373888908864!3d4.661732942152869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9a656a536e2b%3A0x671b407a51c9d5e!2sAndino%20Shopping%20Mall!5e0!3m2!1sen!2sco!4v1721939061036!5m2!1sen!2sco', 'https://images.pexels.com/photos/1484677/pexels-photo-1484677.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')
                ]
                insert_query = "INSERT INTO store_locations (name, address, city, phone, hours, mapEmbedUrl, imageUrl) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                cursor.executemany(insert_query, locations_to_seed)
                print(f"   - Seeded {len(locations_to_seed)} store locations.")
            
            conn.commit()
            print("\n🎉 Database seeding complete!")

    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    initialize_database()
    seed_data()
