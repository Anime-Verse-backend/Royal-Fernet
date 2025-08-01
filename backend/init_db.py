
import os
from app import app, db
from models import User, Product, Setting, StoreLocation
import uuid
import json
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

load_dotenv()

def seed_data():
    """Seeds the database with initial data if it's empty."""
    print("🌱 Seeding database with initial data (if needed)...")

    with app.app_context():
        # Seed Admin User
        if not User.query.filter_by(email='admin@royalfernet.com').first():
            hashed_password = generate_password_hash('adminpass')
            admin = User(name='Admin User', email='admin@royalfernet.com', password_hash=hashed_password, role='admin')
            db.session.add(admin)
            print("   - Default admin user created (admin@royalfernet.com / adminpass).")
        else:
            print("   - Default admin user already exists.")

        # Seed Products
        if Product.query.count() == 0:
            products_to_seed = [
                {
                    "id": str(uuid.uuid4()), "name": "Elegance Chrono", "description": "Un reloj clásico con un toque moderno, perfecto para cualquier ocasión.",
                    "category": "Clásico", "price": 450000, "discount": 10, "stock": 50,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG2.uL7ZzE5A2V_DcyEALC4b?pid=ImgGn"]), "is_featured": True
                },
                {
                    "id": str(uuid.uuid4()), "name": "Sportive GT", "description": "Diseñado para el aventurero urbano, resistente y funcional.",
                    "category": "Deportivo", "price": 320000, "discount": 0, "stock": 75,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG3.bEwXfzw9L2.fS3z4n.sS?pid=ImgGn"]), "is_featured": True
                },
                {
                    "id": str(uuid.uuid4()), "name": "Midnight Sapphire", "description": "Lujo y sofisticación en tu muñeca. Esfera de zafiro y correa de cuero.",
                    "category": "Lujo", "price": 750000, "discount": 15, "stock": 30,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG1.e9aR3vS.iYfLDCcGgrjH?pid=ImgGn"]), "is_featured": True
                },
                {
                    "id": str(uuid.uuid4()), "name": "Aura Minimalist", "description": "Diseño simple, limpio y elegante. Menos es más.",
                    "category": "Minimalista", "price": 280000, "discount": 0, "stock": 100,
                    "images": json.dumps(["https://th.bing.com/th/id/OIG2.g8z6IqP2_3O9RzY4F1qQ?pid=ImgGn"]), "is_featured": False
                }
            ]
            for p_data in products_to_seed:
                new_product = Product(**p_data)
                db.session.add(new_product)
            print(f"   - Seeded {len(products_to_seed)} products.")
        else:
            print("   - Products table already has data.")
        
        # Seed Settings
        if not Setting.query.get(1):
            settings_data = Setting(
                id=1,
                heroImages=json.dumps([
                    {
                        "id": "slide1",
                        "headline": "Elegancia Atemporal, Redefinida.",
                        "subheadline": "Descubre nuestra colección exclusiva de relojes magistralmente elaborados.",
                        "buttonText": "Explorar Colección",
                        "imageUrl": "https://site-2206080.mozfiles.com/files/WhatsApp%20Image%202024-07-16%20at%2011.45.24.jpeg"
                    },
                     {
                        "id": "slide2",
                        "headline": "Innovación en Cada Segundo.",
                        "subheadline": "Nuevos modelos con tecnología de punta y diseño vanguardista.",
                        "buttonText": "Ver Novedades",
                        "imageUrl": "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    }
                ]),
                featuredCollectionTitle="COLECCIÓN ROYAL SERIES",
                featuredCollectionDescription="La Royal Series ofrece una gama de relojes pensados para aquellos que valoran la distinción y el estilo sofisticado.",
                promoSectionTitle="ROYAL DELUXE",
                promoSectionDescription="Descubre la elegancia y la innovación en cada detalle del ROYAL DELUX, nuestro nuevo reloj femenino que redefine el lujo y la sofisticación.",
                promoSectionVideoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ",
                phone="+1 (555) 123-4567",
                contactEmail="contacto@royalfernet.com",
                twitterUrl="#",
                instagramUrl="#",
                facebookUrl="#"
            )
            db.session.add(settings_data)
            print("   - Default store settings inserted.")
        else:
            print("   - Settings table already has data.")

        # Seed Store Locations
        if StoreLocation.query.count() == 0:
            locations_to_seed = [
                {
                    "name": "Boutique Principal - El Tesoro",
                    "address": "Carrera 25A # 1A Sur-45",
                    "city": "Medellín, Antioquia",
                    "phone": "(604) 123 4567",
                    "hours": "Lunes a Sábado: 10:00 AM - 9:00 PM",
                    "mapEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.339668489869!2d-75.56821218898139!3d6.219085093754988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e44282dd3832d61%3A0x47b96e19a41c6e2a!2sParque%20Comercial%20El%20Tesoro!5e0!3m2!1sen!2sco!4v1721938978130!5m2!1sen!2sco",
                    "imageUrl": "https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                },
                {
                    "name": "Tienda de Lujo - Andino",
                    "address": "Carrera 11 # 82-71",
                    "city": "Bogotá, Cundinamarca",
                    "phone": "(601) 765 4321",
                    "hours": "Lunes a Sábado: 10:00 AM - 8:00 PM",
                    "mapEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.6215392769417!2d-74.05373888908864!3d4.661732942152869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9a656a536e2b%3A0x671b407a51c9d5e!2sAndino%20Shopping%20Mall!5e0!3m2!1sen!2sco!4v1721939061036!5m2!1sen!2sco",
                    "imageUrl": "https://images.pexels.com/photos/1484677/pexels-photo-1484677.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                }
            ]
            for loc_data in locations_to_seed:
                new_location = StoreLocation(**loc_data)
                db.session.add(new_location)
            print(f"   - Seeded {len(locations_to_seed)} store locations.")
        else:
            print("   - Store locations table already has data.")
        
        db.session.commit()
        print("\n🎉 Database seeding complete!")


if __name__ == '__main__':
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✅ Tables created or already exist.")
        seed_data()
