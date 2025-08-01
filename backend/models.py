from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy_serializer import SerializerMixin

# Determine the JSON type based on the database engine.
# Use JSONB for PostgreSQL for better performance, and JSON for others (like MySQL/SQLite).
json_type = JSONB if db.engine.name == 'postgresql' else db.JSON

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    serialize_rules = ('-password_hash',) # Exclude password hash from serialization

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default='user') # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model, SerializerMixin):
    __tablename__ = 'products'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    discount = db.Column(db.Integer, default=0)
    stock = db.Column(db.Integer, nullable=False, default=100)
    images = db.Column(json_type, nullable=False)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Setting(db.Model, SerializerMixin):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True, default=1)
    heroImages = db.Column(json_type)
    featuredCollectionTitle = db.Column(db.String(255))
    featuredCollectionDescription = db.Column(db.Text)
    promoSectionTitle = db.Column(db.String(255))
    promoSectionDescription = db.Column(db.Text)
    promoSectionVideoUrl = db.Column(db.String(2048))
    phone = db.Column(db.String(255))
    contactEmail = db.Column(db.String(255))
    twitterUrl = db.Column(db.String(2048))
    instagramUrl = db.Column(db.String(2048))
    facebookUrl = db.Column(db.String(2048))

class Notification(db.Model, SerializerMixin):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    imageUrl = db.Column(db.String(2048))
    linkUrl = db.Column(db.String(2048))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class StoreLocation(db.Model, SerializerMixin):
    __tablename__ = 'store_locations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    hours = db.Column(db.String(255), nullable=False)
    mapEmbedUrl = db.Column(db.Text, nullable=False)
    imageUrl = db.Column(db.String(2048), nullable=False)
