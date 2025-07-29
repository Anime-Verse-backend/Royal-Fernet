
import os
import pymysql
import uuid
import json
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

# --- Database Connection ---
try:
    # Connect without specifying the database first to create it if it doesn't exist
    connection = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=int(os.getenv('DB_PORT')),
        ssl_verify_cert=False,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    print("✅ Successfully connected to MySQL server.")
except pymysql.MySQLError as e:
    print(f"❌ Error connecting to MySQL: {e}")
    exit(1)

try:
    with connection.cursor() as cursor:
        db_name = os.getenv('DB_NAME', 'royal')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute(f"USE `{db_name}`")
        print(f"✅ Database '{db_name}' is ready.")

        # --- Table Creation ---

        # Users Table (for admins and general users)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Table 'users' created or already exists.")

        # Products Table
        cursor.execute("""
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
        """)
        print("✅ Table 'products' created or already exists.")

        # Settings Table (single row)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY DEFAULT 1,
                heroHeadline TEXT,
                heroSubheadline TEXT,
                heroButtonText VARCHAR(255),
                mainImageUrl VARCHAR(2048),
                featuredCollectionTitle VARCHAR(255),
                featuredCollectionDescription TEXT,
                promoSectionTitle VARCHAR(255),
                promoSectionDescription TEXT,
                promoSectionVideoUrl VARCHAR(2048),
                locationSectionTitle VARCHAR(255),
                address VARCHAR(255),
                hours VARCHAR(255),
                mapEmbedUrl TEXT,
                phone VARCHAR(255),
                contactEmail VARCHAR(255),
                twitterUrl VARCHAR(2048),
                instagramUrl VARCHAR(2048),
                facebookUrl VARCHAR(2048),
                CONSTRAINT single_row CHECK (id = 1)
            )
        """)
        print("✅ Table 'settings' created or already exists.")

        # Notifications Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message TEXT NOT NULL,
                imageUrl VARCHAR(2048),
                linkUrl VARCHAR(2048),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Table 'notifications' created or already exists.")

        # --- Seeding Data ---
        print("\n🌱 Seeding database with initial data...")

        # Seed Admin User
        cursor.execute("SELECT id FROM users WHERE email = 'admin@royalfernet.com'")
        if cursor.fetchone() is None:
            hashed_password = generate_password_hash('adminpass')
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, role) 
                VALUES ('Admin User', 'admin@royalfernet.com', %s, 'admin')
            """, (hashed_password,))
            print("   - Default admin user created (admin@royalfernet.com / adminpass).")
        else:
            print("   - Default admin user already exists.")

        # Seed Products
        cursor.execute("SELECT COUNT(*) as count FROM products")
        if cursor.fetchone()['count'] == 0:
            products_to_seed = [
                {
                    "id": str(uuid.uuid4()), "name": "Elegance Chrono", "description": "Un reloj clásico con un toque moderno, perfecto para cualquier ocasión.",
                    "category": "Clásico", "price": 450.00, "discount": 10, "stock": 50,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG2.uL7ZzE5A2V_DcyEALC4b?pid=ImgGn"]), "is_featured": True
                },
                {
                    "id": str(uuid.uuid4()), "name": "Sportive GT", "description": "Diseñado para el aventurero urbano, resistente y funcional.",
                    "category": "Deportivo", "price": 320.00, "discount": 0, "stock": 75,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG3.bEwXfzw9L2.fS3z4n.sS?pid=ImgGn"]), "is_featured": True
                },
                {
                    "id": str(uuid.uuid4()), "name": "Midnight Sapphire", "description": "Lujo y sofisticación en tu muñeca. Esfera de zafiro y correa de cuero.",
                    "category": "Lujo", "price": 750.00, "discount": 15, "stock": 30,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG1.e9aR3vS.iYfLDCcGgrjH?pid=ImgGn"]), "is_featured": True
                },
                {
                    "id": str(uuid.uuid4()), "name": "Aura Minimalist", "description": "Diseño simple, limpio y elegante. Menos es más.",
                    "category": "Minimalista", "price": 280.00, "discount": 0, "stock": 100,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG2.g8z6IqP2_3O9RzY4F1qQ?pid=ImgGn"]), "is_featured": False
                }
            ]
            for p in products_to_seed:
                cursor.execute("""
                    INSERT INTO products (id, name, description, category, price, discount, stock, images, is_featured)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, tuple(p.values()))
            print(f"   - Seeded {len(products_to_seed)} products.")
        else:
            print("   - Products table already has data.")

        # Seed Settings
        cursor.execute("SELECT COUNT(*) as count FROM settings")
        if cursor.fetchone()['count'] == 0:
            settings_data = {
                "heroHeadline": "Elegancia Atemporal, Redefinida.",
                "heroSubheadline": "Descubre nuestra colección exclusiva de relojes magistralmente elaborados.",
                "heroButtonText": "Explorar Colección",
                "mainImageUrl": "https://site-2206080.mozfiles.com/files/WhatsApp%20Image%202024-07-16%20at%2011.45.24.jpeg",
                "featuredCollectionTitle": "COLECCIÓN ROYAL SERIES",
                "featuredCollectionDescription": "La Royal Series ofrece una gama de relojes pensados para aquellos que valoran la distinción y el estilo sofisticado.",
                "promoSectionTitle": "ROYAL DELUXE",
                "promoSectionDescription": "Descubre la elegancia y la innovación en cada detalle del ROYAL DELUX, nuestro nuevo reloj femenino que redefine el lujo y la sofisticación.",
                "promoSectionVideoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "locationSectionTitle": "Visita Nuestra Tienda Insignia",
                "address": "123 Avenida de Lujo, Ginebra, Suiza",
                "hours": "Abierto de Lunes a Sábado, de 10:00 AM a 7:00 PM",
                "mapEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2761.954833291079!2d6.140358315582398!3d46.19839297911627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c652be9a01d6b%3A0x86734c56259c7322!2sRolex%20SA!5e0!3m2!1sen!2sch!4v1622546875878!5m2!1sen!2sch",
                "phone": "+1 (555) 123-4567",
                "contactEmail": "contacto@royalfernet.com",
                "twitterUrl": "#",
                "instagramUrl": "#",
                "facebookUrl": "#"
            }
            cursor.execute("""
                INSERT INTO settings (id, heroHeadline, heroSubheadline, heroButtonText, mainImageUrl, 
                                      featuredCollectionTitle, featuredCollectionDescription, promoSectionTitle, promoSectionDescription, promoSectionVideoUrl, 
                                      locationSectionTitle, address, hours, mapEmbedUrl, 
                                      phone, contactEmail, twitterUrl, instagramUrl, facebookUrl)
                VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, tuple(settings_data.values()))
            print("   - Default store settings inserted.")
        else:
            print("   - Settings table already has data.")

    connection.commit()
    print("\n🎉 Database initialization and seeding complete!")

finally:
    connection.close()


