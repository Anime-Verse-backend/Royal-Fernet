
import os
import psycopg2
import psycopg2.extras
import json
import uuid
import logging
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()
logging.basicConfig(level=logging.INFO)

# --- Database Connection ---
def get_db_connection():
    try:
        conn_string = os.getenv('DATABASE_URL')
        if not conn_string:
            raise ValueError("DATABASE_URL environment variable is not set for init_db.")
        
        connection = psycopg2.connect(conn_string)
        logging.info("Successfully connected to the PostgreSQL database for init_db.")
        return connection
    except psycopg2.Error as e:
        logging.error(f"Error connecting to PostgreSQL server in init_db: {e}")
        exit(1)

def alter_table_add_column(cursor, table_name, column_name, column_type):
    """Checks for the existence of a column and adds it if it doesn't exist."""
    try:
        cursor.execute(f"""
            SELECT 1 FROM information_schema.columns
            WHERE table_name='{table_name}' AND column_name='{column_name}';
        """)
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};")
            print(f"   - Column '{column_name}' added to '{table_name}' table.")
        else:
            print(f"   - Column '{column_name}' already exists in '{table_name}' table.")
    except psycopg2.Error as e:
        print(f"   - Could not alter '{table_name}' table for column '{column_name}': {e}")

def initialize_database():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # --- Table Creation ---
            tables = {
                "users": """
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password_hash VARCHAR(255) NOT NULL,
                        role VARCHAR(20) NOT NULL DEFAULT 'user',
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
                        images JSONB,
                        is_featured BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "settings": """
                    CREATE TABLE IF NOT EXISTS settings (
                        id INT PRIMARY KEY DEFAULT 1,
                        hero_images JSONB,
                        featured_collection_title VARCHAR(255),
                        featured_collection_description TEXT,
                        promo_section_title VARCHAR(255),
                        promo_section_description TEXT,
                        promo_section_video_url VARCHAR(2048),
                        phone VARCHAR(255),
                        contact_email VARCHAR(255),
                        twitter_url VARCHAR(2048),
                        instagram_url VARCHAR(2048),
                        facebook_url VARCHAR(2048)
                    )
                """,
                "notifications": """
                    CREATE TABLE IF NOT EXISTS notifications (
                        id SERIAL PRIMARY KEY,
                        message TEXT NOT NULL,
                        image_url VARCHAR(2048),
                        link_url VARCHAR(2048),
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "store_locations": """
                    CREATE TABLE IF NOT EXISTS store_locations (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        address VARCHAR(255) NOT NULL,
                        city VARCHAR(100) NOT NULL,
                        phone VARCHAR(50) NOT NULL,
                        hours VARCHAR(255) NOT NULL,
                        map_embed_url TEXT,
                        image_url TEXT
                    )
                """
            }
            
            for table_name, create_statement in tables.items():
                cursor.execute(create_statement)
                print(f"✅ Table '{table_name}' created or already exists.")

            # --- Table Alterations ---
            alter_table_add_column(cursor, 'notifications', 'title', 'TEXT')
            alter_table_add_column(cursor, 'settings', 'notifications_enabled', 'BOOLEAN DEFAULT TRUE')
            
            conn.commit()
            print("\n🎉 Database schema initialization complete!")

    finally:
        if conn:
            conn.close()

def seed_data():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
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
                sql = """INSERT INTO settings (id, hero_images, featured_collection_title, featured_collection_description, promo_section_title, promo_section_description, promo_section_video_url, phone, contact_email, twitter_url, instagram_url, facebook_url, notifications_enabled)
                         VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                values = (hero_images, "COLECCIÓN ROYAL SERIES", "Relojes para quienes valoran la distinción.", "ROYAL DELUXE", "Descubre la elegancia y la innovación.", "https://www.youtube.com/embed/dQw4w9WgXcQ", "+15551234567", "contacto@royalfernet.com", "#", "#", "#", True)
                cursor.execute(sql, values)
                print("   - Default store settings inserted.")
            
            # Seed Store Locations
            cursor.execute("SELECT COUNT(*) as count FROM store_locations")
            if cursor.fetchone()['count'] == 0:
                locations_to_seed = [
                    ('Boutique Principal - El Tesoro', 'Carrera 25A # 1A Sur-45', 'Medellín, Antioquia', '(604) 123 4567', 'L-S: 10am-9pm', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.339668489869!2d-75.56821218898139!3d6.219085093754988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e44282dd3832d61%3A0x47b96e19a41c6e2a!2sParque%20Comercial%20El%20Tesoro!5e0!3m2!1sen!2sco!4v1721938978130!5m2!1sen!2sco', 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
                    ('Tienda de Lujo - Andino', 'Carrera 11 # 82-71', 'Bogotá, Cundinamarca', '(601) 765 4321', 'L-S: 10am-8pm', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.6215392769417!2d-74.05373888908864!3d4.661732942152869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9a656a536e2b%3A0x671b407a51c9d5e!2sAndino%20Shopping%20Mall!5e0!3m2!1sen!2sco!4v1721939061036!5m2!1sen!2sco', 'https://images.pexels.com/photos/1484677/pexels-photo-1484677.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')
                ]
                insert_query = "INSERT INTO store_locations (name, address, city, phone, hours, map_embed_url, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                cursor.executemany(insert_query, locations_to_seed)
                print(f"   - Seeded {len(locations_to_seed)} store locations.")
            
            conn.commit()
            print("\n🎉 Database seeding complete!")

    finally:
        if conn:
            conn.close()

def main():
    """Main function to initialize and optionally seed the database."""
    initialize_database()
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if the 'products' table has any data. If not, it's a fresh DB.
            cursor.execute("SELECT COUNT(*) as count FROM products")
            if cursor.fetchone()[0] == 0:
                print("Database appears to be empty. Seeding with initial data.")
                seed_data()
            else:
                print("Database already contains data. Skipping seeding.")
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()

    
  