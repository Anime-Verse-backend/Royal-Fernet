
import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

# --- Database Connection ---
try:
    # Connect without specifying the database first to create it if it doesn't exist
    connection = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=int(os.getenv('DB_PORT')),
        ssl_verify_cert=True,
        ssl={"ca": "./ca.pem"},
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
        # Drop the old table if it exists to apply new schema
        cursor.execute("DROP TABLE IF EXISTS settings")
        cursor.execute("""
            CREATE TABLE settings (
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
        print("✅ Table 'settings' re-created with new schema.")

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

    connection.commit()
    print("\n🎉 Database initialization complete!")

finally:
    connection.close()
