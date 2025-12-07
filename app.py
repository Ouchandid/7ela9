import os
import random
import json
import math
from datetime import datetime, timedelta
# Import secrets for token generation and mail sending mock
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from sqlalchemy import func, event
from sqlalchemy.orm import joinedload
from sqlalchemy.engine import Engine
from sqlalchemy import or_
import secrets # Import secrets for token generation
# --- NEW: Import Flask-Mail for real email sending ---
from flask_mail import Mail, Message

# --- Configuration ---
app = Flask(__name__)

# --- NEW: Load configuration dynamically from config.py ---
from config import Config
app.config.from_object(Config) # Loads SQLALCHEMY_DATABASE_URI and SQLALCHEMY_TRACK_MODIFICATIONS
# --------------------------------------------------------

# The old hardcoded MySQL DB_CONFIG block has been removed, 
# and the DB connection is now set via app.config.from_object(Config)

app.config['SECRET_KEY'] = 'a_very_secret_and_long_key_for_myhair'

# --- EMAIL CONFIGURATION (Using your provided credentials and standard SMTP ports) ---
# *** IMPORTANT: YOU MUST REPLACE 'smtp.yourhost.com' AND '587' with your actual SMTP server details! ***
SENDER_EMAIL = 'contact@7ela9.com'
SENDER_PASSWORD = 'dc9dnn9W@' 

app.config['MAIL_SERVER'] = 'mail.spacemail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True # Use TLS instead of SSL for 587
app.config['MAIL_USERNAME'] = 'contact@7ela9.com'
app.config['MAIL_PASSWORD'] = 'dc9dnn9W@'
app.config['MAIL_DEFAULT_SENDER'] = 'contact@7ela9.com'
# ------------------------------------------------------------------------

db = SQLAlchemy(app)
mail = Mail(app) # Initialize Flask-Mail
# ------------------------------------------

# Define file upload path (for profile and gallery images and virement proof)
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Define allowed extensions for validation
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'} 

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- NEW: I18n Setup ---
TRANSLATIONS = {}
# EDITED: Added 'en' to LANGUAGES
LANGUAGES = ['fr', 'es', 'ar', 'amazigh', 'en']
# EDITED: Changed DEFAULT_LANGUAGE to 'en'
DEFAULT_LANGUAGE = 'en'
TRANSLATIONS_PATH = os.path.join(app.root_path, 'translations')

def load_translations():
    """Loads all translation JSON files into the TRANSLATIONS dictionary."""
    if not os.path.exists(TRANSLATIONS_PATH):
        print(f"ERROR: Translations directory not found at {TRANSLATIONS_PATH}")
        return

    for lang_code in LANGUAGES:
        filepath = os.path.join(TRANSLATIONS_PATH, f'{lang_code}.json')
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                TRANSLATIONS[lang_code] = json.load(f)
        except FileNotFoundError:
            print(f"Warning: Translation file {filepath} not found.")
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in {filepath}")

# Load translations immediately after startup
load_translations()

def get_locale():
    """Determines the current locale from session or defaults."""
    # Priority: 1. User selector (session), 2. Default
    return session.get('language', DEFAULT_LANGUAGE)

def translate(key, lang_code=None):
    """Translates a key into the specified or current language."""
    lang = lang_code or get_locale()
    
    # Fallback to English/Default if the language is not loaded or key is missing
    return TRANSLATIONS.get(lang, {}).get(key, key)

@app.before_request
def before_request():
    """Set the translation function on the global object 'g' for templates."""
    g.locale = get_locale()
    g._ = lambda key: translate(key, g.locale)

@app.context_processor
def inject_i18n():
    """Make the translation function and current language available to all templates."""
    return dict(_=translate, current_language=g.locale, available_languages=LANGUAGES)

@app.route('/set_language/<lang_code>')
def set_language(lang_code):
    """Route to set the user's preferred language and redirect back."""
    if lang_code in LANGUAGES:
        session['language'] = lang_code
    return redirect(request.referrer or url_for('index'))
# --- END NEW: I18n Setup ---


# --- Utility for File Upload Validation ---
def allowed_file(filename):
    """Checks if a file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Utility Functions for Email Confirmation and Activation ---

# MODIFIED: 1. Generate a 6-digit numeric code instead of a URL token
def generate_confirmation_token():
    """Generates a secure 6-digit numeric code."""
    # Ensure the code is 6 digits long and only contains numbers
    return ''.join(random.choices('0123456789', k=6))

# MODIFIED: 2. Send the 6-digit code in the email body
def send_confirmation_email(user, code):
    """
    REAL FUNCTION: Sends an email with the confirmation code using Flask-Mail.
    """
    
    # --- Actual Email Sending Logic ---
    try:
        msg = Message(
            'Your 7ela9 Account Confirmation Code',
            recipients=[user.email],
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        # Include the 6-digit code in the email body
        msg.body = f"Dear {user.name},\n\nYour 6-digit code to confirm your account and activate your profile is:\n\nCONFIRMATION CODE: {code}\n\nPlease enter this code on the confirmation page after logging in.\n\nIf you did not request this, please ignore this email."
        
        # Send the actual email
        mail.send(msg)
        
        # Log to console for debugging/confirmation
        print(f"\n=======================================================")
        print(f"EMAIL SENT (To: {user.email})")
        print(f"From: {app.config['MAIL_DEFAULT_SENDER']}")
        print(f"Confirmation CODE: {code}")
        print(f"=======================================================\n")
        
    except Exception as e:
        # Fallback to console print if sending fails
        print(f"\n=======================================================")
        print(f"ERROR: REAL EMAIL SENDING FAILED ({e})")
        print(f"FALLBACK CONSOLE PRINT (To: {user.email})")
        print(f"CONFIRMATION CODE: {code}")
        print(f"=======================================================\n")

    # Return the code for the flash message
    return code

# --- NEW HELPER: Send Password Reset Code ---
def send_reset_email(user, code):
    """
    Sends an email with the password reset code using Flask-Mail.
    Reuses the existing mail configuration.
    """
    try:
        msg = Message(
            'Your 7ela9 Password Reset Code',
            recipients=[user.email],
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        msg.body = f"Dear {user.name},\n\nYour 6-digit code to reset your password is:\n\nRESET CODE: {code}\n\nPlease enter this code on the verification page.\n\nIf you did not request a password reset, please ignore this email."

        mail.send(msg)
        print(f"\n=======================================================")
        print(f"PASSWORD RESET EMAIL SENT (To: {user.email})")
        print(f"From: {app.config['MAIL_DEFAULT_SENDER']}")
        print(f"Reset CODE: {code}")
        print(f"=======================================================\n")

    except Exception as e:
        print(f"\n=======================================================")
        print(f"ERROR: REAL EMAIL SENDING FAILED ({e})")
        print(f"FALLBACK CONSOLE PRINT (To: {user.email})")
        print(f"RESET CODE: {code}")
        print(f"=======================================================\n")
    return code
# --- END NEW HELPER ---


# --- Haversine Distance Function for Mocking Nearby Search ---
def haversine(lat1, lon1, lat2, lon2):
# ... (rest of the file remains unchanged until the new routes)
    """
    Calculate the distance (in km) between two points 
    on the earth (specified in decimal degrees).
    """
    R = 6371 # Earth radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

# --- Database Models (Updated) ---
class User(db.Model):
# ... (User model definition is unchanged as it reuses 'confirmation_token')
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False) # Hashed in a real app
    type = db.Column(db.String(20), nullable=False)  # 'client' or 'coiffeur'
    city = db.Column(db.String(50))
    phone = db.Column(db.String(20), nullable=True) 

    # REQUIREMENT 1: Email Confirmation fields
    # This field is now used for BOTH email confirmation and password reset codes.
    is_confirmed = db.Column(db.Boolean, default=False)
    confirmation_token = db.Column(db.String(100), nullable=True, unique=True) 
    
    coiffeur = db.relationship('Coiffeur', backref='user', uselist=False)
    comments_made = db.relationship('Comment', foreign_keys='Comment.client_id', backref='client', lazy='dynamic')
    reservations_made = db.relationship('Reservation', foreign_keys='Reservation.client_id', backref='client', lazy='dynamic')
    publications_made = db.relationship('Publication', foreign_keys='Publication.author_id', backref='author', lazy='dynamic')
    likes_made = db.relationship('PublicationLike', foreign_keys='PublicationLike.client_id', backref='client', lazy='dynamic')
    pub_comments_made = db.relationship('PublicationComment', foreign_keys='PublicationComment.client_id', backref='client', lazy='dynamic')
    subscriptions = db.relationship('Subscription', foreign_keys='Subscription.client_id', backref='client', lazy='dynamic')
    
    # Updated: Deplacement Requests now link directly to the client who created them
    created_deplacement_requests = db.relationship('DeplacementRequest', foreign_keys='DeplacementRequest.client_id', backref='client', lazy='dynamic')
    
    # New: Price Proposals received by this client (now linked to DeplacementRequest)
    # We will query proposals via the request object for simplicity/correctness

class Coiffeur(db.Model):
# ... (Coiffeur model and all other models remain unchanged) ...
    __tablename__ = 'coiffeurs'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    profile_image = db.Column(db.String(200), default='/static/uploads/default_coiffeur.png')
    category = db.Column(db.String(50), nullable=False)  # Homme, Femme, Déplacé
    description = db.Column(db.Text)
    address = db.Column(db.String(200))
    people_waiting = db.Column(db.Integer, default=0)
    current_capacity = db.Column(db.Integer, default=0) 
    rating = db.Column(db.Float, default=4.5)
    
    latitude = db.Column(db.Float(precision=8), nullable=True)
    longitude = db.Column(db.Float(precision=8), nullable=True)
    location_updated_at = db.Column(db.DateTime, nullable=True)
    
    # Status: 'pending email confirmation', 'pending activation', 'active', 'rejected'
    status = db.Column(db.String(50), default='pending email confirmation')
    virement_name = db.Column(db.String(100), nullable=True) # Full name of person who made the virement
    virement_proof = db.Column(db.String(200), nullable=True) # Path to virement proof image
    activation_date = db.Column(db.DateTime, nullable=True) # Date of admin activation
    
    # --- START FIX 2: Add Free Trial Fields ---
    trial_start_date = db.Column(db.DateTime, nullable=True)
    trial_end_date = db.Column(db.DateTime, nullable=True)
    # --- END FIX 2 ---

    services = db.relationship('Service', backref='coiffeur', lazy='dynamic')
    photos = db.relationship('Photo', backref='coiffeur', lazy='dynamic')
    comments_received = db.relationship('Comment', foreign_keys='Comment.coiffeur_id', backref='coiffeur', lazy='dynamic')
    reservations_received = db.relationship('Reservation', foreign_keys='Reservation.coiffeur_id', backref='coiffeur', lazy='dynamic')
    subscribers = db.relationship('Subscription', foreign_keys='Subscription.coiffeur_id', backref='coiffeur', lazy='dynamic')
    
    # NEW: Menu items
    menu_items = db.relationship('Menu', backref='coiffeur', lazy='dynamic')
    
    # FIX: Removed redundant backref='coiffeur' which conflicts with PriceProposal.coiffeur relationship below.
    made_price_proposals = db.relationship('PriceProposal', foreign_keys='PriceProposal.coiffeur_id', lazy='dynamic')

class Service(db.Model):
# ... (rest of models remain unchanged) ...
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False)
    service_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

# NEW MODEL: Menu for Coiffeurs (Requested in Step 3)
class Menu(db.Model):
    __tablename__ = 'menu'
    id = db.Column(db.Integer, primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Photo(db.Model):
    __tablename__ = 'photos'
    id = db.Column(db.Integer, primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False)
    image_path = db.Column(db.String(200), nullable=False)
    likes = db.Column(db.Integer, default=0) # Mocking likes

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Reservation(db.Model):
    __tablename__ = 'reservations'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True) # Link to service
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    notes = db.Column(db.Text, nullable=True) # New field for client notes
    status = db.Column(db.String(50), default='Pending') # Pending, Confirmed, Cancelled, Completed
    
    service_detail = db.relationship('Service', backref='reservations', foreign_keys=[service_id])

class Publication(db.Model):
    __tablename__ = 'publications'
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    images = db.Column(db.Text, nullable=True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    likes = db.relationship('PublicationLike', backref='publication', lazy='dynamic', cascade="all, delete-orphan")
    comments = db.relationship('PublicationComment', backref='publication', lazy='dynamic', cascade="all, delete-orphan")
    
    def image_list(self):
        try:
            return json.loads(self.images) if self.images else []
        except:
            return []

class PublicationLike(db.Model):
    __tablename__ = 'publication_likes'
    publication_id = db.Column(db.Integer, db.ForeignKey('publications.id'), primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    
class PublicationComment(db.Model):
    __tablename__ = 'publication_comments'
    id = db.Column(db.Integer, primary_key=True)
    publication_id = db.Column(db.Integer, db.ForeignKey('publications.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    comment_text = db.Column(db.String(250), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), primary_key=True)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)

# Updated MODEL: The request is now for a client to request a service.
class DeplacementRequest(db.Model):
    __tablename__ = 'deplacement_requests'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # target_coiffeur_id is NULL if it's a broadcast request (new behavior)
    # It is set when the client accepts a proposal.
    target_coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=True) 
    
    service_requested = db.Column(db.String(100), nullable=False)
    client_location = db.Column(db.String(200), nullable=False)
    preferred_date = db.Column(db.Date, nullable=False)
    preferred_time = db.Column(db.Time, nullable=False)
    details = db.Column(db.Text, nullable=True)
    # Status: Pending (broadcast), Proposed, Accepted, Refused, Cancelled
    status = db.Column(db.String(50), default='Pending') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    proposals = db.relationship('PriceProposal', backref='request', lazy='dynamic', cascade="all, delete-orphan")

class PriceProposal(db.Model):
    __tablename__ = 'price_proposals'
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('deplacement_requests.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False) # Coiffeur making the proposal
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # Client who receives the proposal
    proposed_price = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Pending') # Pending, Accepted, Refused
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    coiffeur = db.relationship('Coiffeur', backref='received_proposals', foreign_keys=[coiffeur_id])

# --- Utility Functions (unchanged) ---
def get_coiffeur_data(coiffeur_id):
# ... (get_coiffeur_data remains unchanged) ...
    """Fetches all necessary data for a coiffeur profile."""
    coiffeur = Coiffeur.query.options(joinedload(Coiffeur.user)).get(coiffeur_id)
    
    if coiffeur:
        services = Service.query.filter_by(coiffeur_id=coiffeur_id).all()
        # NEW: Fetch Menu Items
        menu_items = Menu.query.filter_by(coiffeur_id=coiffeur_id).order_by(Menu.name).all()
        comments = Comment.query.filter_by(coiffeur_id=coiffeur_id).order_by(Comment.timestamp.desc()).all()
        
        current_user = get_current_user()
        is_subscribed = False
        if current_user and current_user.type == 'client':
             is_subscribed = Subscription.query.filter_by(client_id=current_user.id, coiffeur_id=coiffeur_id).first() is not None

        publications_raw = Publication.query.filter_by(author_id=coiffeur_id).order_by(Publication.created_at.desc()).all()
        
        publications = []
        client_id = current_user.id if current_user and current_user.type == 'client' else None

        for pub in publications_raw:
            pub_data = {
                'id': pub.id,
                'author_id': pub.author_id,
                'text': pub.text,
                'images': pub.image_list(),
                'created_at': pub.created_at,
                'likes_count': pub.likes.count(),
                'comments_count': pub.comments.count(),
                'liked_by_user': False,
            }
            pub_data['comments'] = db.session.query(
                PublicationComment, User.name, Coiffeur.profile_image
            ).join(
                User, PublicationComment.client_id == User.id
            ).outerjoin(
                Coiffeur, User.id == Coiffeur.user_id
            ).filter(
                PublicationComment.publication_id == pub.id
            ).order_by(
                PublicationComment.created_at.asc()
            ).all()

            if client_id:
                pub_data['liked_by_user'] = PublicationLike.query.filter_by(publication_id=pub.id, client_id=client_id).first() is not None
            
            publications.append(pub_data)

        # --- FIX 4: Add Subscriber Count to Data ---
        subscriber_count = Subscription.query.filter_by(coiffeur_id=coiffeur_id).count()

        return {
            'user': coiffeur.user,
            'coiffeur': coiffeur,
            'services': services,
            'menu_items': menu_items, # NEW
            'photos': Photo.query.filter_by(coiffeur_id=coiffeur_id).all(),
            'comments': comments,
            'publications': publications,
            'is_subscribed': is_subscribed,
            'subscriber_count': subscriber_count # NEW
        }
    return None

def seed_db():
# ... (seed_db remains unchanged) ...
    # Check if we need to seed data (i.e., if tables are empty)
    try:
        if User.query.count() > 0:
            print("Database already contains data. Skipping seeding.")
            return
    except Exception as e:
        print("Starting data seeding process.")
        pass # Continue to the seeding logic

    # 1. Clients (Set to active/confirmed)
    # Mock confirmed user
    client1 = User(name='Sarah Connor', email='sarah@client.com', password='password', type='client', city='Paris', phone='0612345678', is_confirmed=True) 
    client2 = User(name='John Smith', email='john@client.com', password='password', type='client', city='Lyon', phone='0698765432', is_confirmed=True)
    # Mock unconfirmed user (using a 6-digit code for seeding)
    client3 = User(name='Alice Johnson', email='alice@client.com', password='password', type='client', city='Paris', phone='0655551111', is_confirmed=False, confirmation_token='123456')
    db.session.add_all([client1, client2, client3])
    db.session.commit()

    # 2. Coiffeurs (Set to active/confirmed)
    coiffeur1_user = User(name='Jules Vernes', email='jules@coiffeur.com', password='password', type='coiffeur', city='Paris', phone='0140200000', is_confirmed=True)
    coiffeur2_user = User(name='Marie Curie', email='marie@coiffeur.com', password='password', type='coiffeur', city='Lyon', phone='0478000000', is_confirmed=True)
    coiffeur3_user = User(name='Léa Déplacé', email='lea@coiffeur.com', password='password', type='coiffeur', city='Paris', phone='0611223344', is_confirmed=True)
    coiffeur4_user = User(name='Pierre Proche', email='pierre@coiffeur.com', password='password', type='coiffeur', city='Paris', phone='0699887766', is_confirmed=True)

    db.session.add_all([coiffeur1_user, coiffeur2_user, coiffeur3_user, coiffeur4_user])
    db.session.commit()

    # NOTE: Added latitude and longitude for seeding.
    # Set status to 'active' for existing seeded users
    
    # --- FIX 2: Apply trial logic to seeded coiffeurs for consistency ---
    trial_start = datetime.utcnow()
    trial_end = trial_start + timedelta(days=30)
    
    coiffeur1 = Coiffeur(user_id=coiffeur1_user.id, category='Femme', 
                         description='Expert in balayage and long hair styles. Voted #1 in Paris.',
                         address='14 Rue de la Paix, Paris', people_waiting=4, current_capacity=2, rating=4.9,
                         latitude=48.8719, longitude=2.3308, location_updated_at=datetime.utcnow(), 
                         profile_image='/static/avatar/woman.png', # MODIFIED
                         status='active',
                         trial_start_date=trial_start,
                         trial_end_date=trial_end) 
    coiffeur2 = Coiffeur(user_id=coiffeur2_user.id, category='Homme', 
                         description='Specialist in sharp fades and classic mens cuts. Fast and precise.',
                         address='22 Place Bellecour, Lyon', people_waiting=0, current_capacity=1, rating=4.7,
                         latitude=45.7594, longitude=4.8315, location_updated_at=datetime.utcnow(), 
                         profile_image='/static/avatar/man.png', # MODIFIED
                         status='active',
                         trial_start_date=trial_start,
                         trial_end_date=trial_end) 
    coiffeur3 = Coiffeur(user_id=coiffeur3_user.id, category='Déplacé', 
                         description='Mobile stylist for weddings, events, and home visits in the Paris region.',
                         address='Mobile Stylist (Paris Region)', people_waiting=1, current_capacity=0, rating=4.6,
                         latitude=48.8650, longitude=2.3450, location_updated_at=datetime.utcnow(), 
                         profile_image='/static/avatar/dep.png', # MODIFIED
                         status='active',
                         trial_start_date=trial_start,
                         trial_end_date=trial_end)
    coiffeur4 = Coiffeur(user_id=coiffeur4_user.id, category='Femme',
                         description='Quick cuts and vibrant coloring.',
                         address='8 Rue de Rivoli, Paris', people_waiting=2, current_capacity=1, rating=4.3,
                         latitude=48.8590, longitude=2.3480, location_updated_at=datetime.utcnow(), 
                         profile_image='/static/avatar/woman.png', # MODIFIED
                         status='active',
                         trial_start_date=trial_start,
                         trial_end_date=trial_end)
    # --- END FIX 2 ---
    
    db.session.add_all([coiffeur1, coiffeur2, coiffeur3, coiffeur4])
    db.session.commit()

    # 3. Menu Items (NEW)
    menu1_cut = Menu(coiffeur_id=coiffeur1.user_id, name='Woman\'s Cut & Blowdry', price=75.00, description='Includes wash, style consultation, precision cut, and blowdry.')
    menu1_balayage = Menu(coiffeur_id=coiffeur1.user_id, name='Full Balayage', price=180.00, description='Complete freehand color application, toner included.')
    menu2_fade = Menu(coiffeur_id=coiffeur2.user_id, name='Skin Fade', price=40.00, description='Zero to blend. Sharp lines and finish.')
    
    db.session.add_all([menu1_cut, menu1_balayage, menu2_fade])
    db.session.commit()

    # 4. Publications, Subscriptions, Reservations (existing seeding logic remains)
    pub1_images = json.dumps([
        '/static/uploads/pub_image_1.jpg', 
        '/static/uploads/pub_image_2.jpg'
    ])
    pub1 = Publication(author_id=coiffeur1_user.id, text='Loving this dramatic winter balayage! Took 4 hours but totally worth it. #hairgoals', images=pub1_images)
    db.session.add(pub1)
    db.session.commit() 

    # Seed Subscriptions
    sub1 = Subscription(client_id=client1.id, coiffeur_id=coiffeur1.user_id)
    sub2 = Subscription(client_id=client2.id, coiffeur_id=coiffeur1.user_id)
    sub3 = Subscription(client_id=client3.id, coiffeur_id=coiffeur1.user_id)
    sub4 = Subscription(client_id=client3.id, coiffeur_id=coiffeur3.user_id) # Client 3 subscribes to a Déplacé stylist
    db.session.add_all([sub1, sub2, sub3, sub4])

    # Note: Removed the old DeplacementRequest seeding as the model changed structure.

    db.session.commit()
    print("Database seeded with demo data including capacity, publications, subscriptions, and new Menu items.")


# --- Before first request (Run on startup) ---
with app.app_context():
    # 1. CRITICAL: Drop and Create all tables every time to force schema update
    # This should ONLY be used in development/demo environments.
    print("Forcing database schema recreation to ensure models are synchronized.")
    # FIX 2: Need to manually drop/create all tables again due to model change
    db.drop_all() 
    db.create_all() 
    
    # 2. Seed data if necessary (now that tables exist)
    seed_db()


# --- Routes ---

# Helper to check login status
def is_logged_in():
    return 'user_id' in session

def get_current_user():
    if is_logged_in():
        return User.query.get(session['user_id'])
    return None

@app.context_processor
def inject_user():
    # FIX 1: Provide datetime.now() for reservation.html date calculations
    # MODIFIED: Also inject i18n functions
    return dict(
        current_user=get_current_user(), 
        now=datetime.now, 
        _=translate, 
        current_language=get_locale(), 
        available_languages=LANGUAGES
    )


# --- MODIFIED: 1. HOME PAGE LOGIC (unchanged) ---
@app.route('/')
def index():
    """Renders the public index page with stylist previews."""
    # Fetch a sample of stylists for the homepage preview section.
    
    # Base Query: Join User and Coiffeur, filter by active status, limit to 8 for preview
    coiffeur_users = db.session.query(User, Coiffeur).join(
        Coiffeur, User.id == Coiffeur.user_id
    ).filter(
        Coiffeur.status == 'active' # Only show active coiffeurs on public pages
    ).limit(8).all()
    
    stylists = []
    for user, coiffeur in coiffeur_users:
        stylists.append({
            'user': user,
            'coiffeur': coiffeur,
            'rating': coiffeur.rating,
            'comment_count': coiffeur.comments_received.count()
        })
        
    return render_template('index.html', stylists=stylists)

# NEW ROUTE: Display the 6-digit confirmation code form
@app.route('/confirm/code', methods=['GET'])
def confirm_code_page():
    """Displays the page for the user to input the 6-digit confirmation code."""
    # This page is accessible only if the user is logged in but not confirmed
    if not is_logged_in():
        flash('Please log in to enter your confirmation code.', 'info')
        return redirect(url_for('login'))
        
    user = get_current_user()
    if user.is_confirmed:
        flash('Your account is already confirmed.', 'info')
        # FIX 2: If a coiffeur's account is confirmed, redirect to dashboard
        return redirect(url_for('dashboard'))
        
    # User is logged in but unconfirmed, render the input form
    return render_template('confirm_code.html')

# MODIFIED ROUTE: The original confirmation route now handles the POST request 
# (and GET, though GET is mostly deprecated)
@app.route('/confirm/code', methods=['POST'])
@app.route('/confirm/<token>', methods=['GET']) # Keep old route for compatibility/re-use
def confirm_email(token=None):
    """
    Handles confirmation either via old URL token (GET) 
     OR the new 6-digit code (POST).
    """
    
    if request.method == 'POST':
        # New 6-digit code confirmation logic
        
        # 1. User must be logged in to submit the code
        if not is_logged_in():
            flash('Please log in before submitting the confirmation code.', 'error')
            return redirect(url_for('login'))
            
        user = get_current_user()
        if user.is_confirmed:
            flash('Your account is already confirmed. Please log in.', 'info')
            return redirect(url_for('dashboard'))
            
        # 2. Get the submitted code (from the combined input in the HTML form)
        # Note: The combined input should be named 'confirmation_code' per the previous HTML
        submitted_code = request.form.get('confirmation_code')
        
        # 3. Check the submitted code against the user's stored token
        if submitted_code and submitted_code == user.confirmation_token:
            # Code is correct: confirm the user (Requirement 7)
            user.is_confirmed = True
            user.confirmation_token = None # Clear code after use
            
            # For coiffeurs, update status
            if user.type == 'coiffeur':
                coiffeur = Coiffeur.query.get(user.id)
                if coiffeur and coiffeur.status == 'pending email confirmation':
                    
                    # --- START FIX 2: Coiffeur Signup Payment Logic (Free Trial) ---
                    # Set status to active immediately
                    coiffeur.status = 'active'
                    
                    # Store trial start and end dates (1 month free trial)
                    coiffeur.trial_start_date = datetime.utcnow()
                    coiffeur.trial_end_date = coiffeur.trial_start_date + timedelta(days=30)
                    coiffeur.activation_date = datetime.utcnow() # Treat trial start as activation
                    
                    flash(f'Email confirmed! Your coiffeur profile is now ACTIVE with a 1-month free trial (ends {coiffeur.trial_end_date.strftime("%Y-%m-%d")}).', 'success')
                    # --- END FIX 2 ---
                    
                else:
                    # Should not happen if they follow the flow, but keep logic generic
                    flash('Email confirmed successfully! Your profile is now active.', 'success')
            else:
                flash('Email confirmed successfully! You can now access all features.', 'success')
                
            db.session.commit()
            return redirect(url_for('dashboard')) # Redirect to dashboard
        else:
            # Incorrect code: return the same type of error (Requirement 7)
            flash('Invalid or incorrect confirmation code.', 'error')
            # Render the code input page again
            return render_template('confirm_code.html')
            
    elif request.method == 'GET' and token:
        # Handle the deprecated URL token method (keep for seed compatibility)
        user = User.query.filter_by(confirmation_token=token).first()
        
        if user:
            if user.is_confirmed:
                flash('Your account is already confirmed. Please log in.', 'info')
            else:
                user.is_confirmed = True
                user.confirmation_token = None # Clear token after use
                
                # For coiffeurs, update status to 'pending activation' after email confirmation
                if user.type == 'coiffeur':
                    coiffeur = Coiffeur.query.get(user.id)
                    if coiffeur and coiffeur.status == 'pending email confirmation':
                         # --- START FIX 2: Apply trial logic to old flow just in case ---
                        coiffeur.status = 'active'
                        coiffeur.trial_start_date = datetime.utcnow()
                        coiffeur.trial_end_date = coiffeur.trial_start_date + timedelta(days=30)
                        coiffeur.activation_date = datetime.utcnow()
                        flash(f'Email confirmed! Your coiffeur profile is now ACTIVE with a 1-month free trial (ends {coiffeur.trial_end_date.strftime("%Y-%m-%d")}).', 'success')
                        # --- END FIX 2 ---
                    else:
                        flash('Email confirmed successfully! Your profile is now awaiting admin review.', 'success')
                else:
                    flash('Email confirmed successfully! You can now log in.', 'success')
                    
                db.session.commit()
                session['user_id'] = user.id
                session['user_type'] = user.type
                return redirect(url_for('dashboard')) # Redirect to dashboard/login
        else:
            flash('Invalid or expired confirmation link.', 'error')
            
    # Default fallback for GET requests
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
# ... (Login route remains unchanged) ...
    """Login Route (MODIFIED to enforce email confirmation)"""
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        # Check both email and password (mocking password check)
        user = User.query.filter_by(email=email, password=password).first() 
        
        if user:
            # REQUIREMENT 1: Users cannot log in before confirming their email
            if not user.is_confirmed:
                flash('Please enter the 6-digit code sent to your email to confirm your account.', 'warning')
                # Resend the code and redirect to the code input page
                if user.confirmation_token:
                    send_confirmation_email(user, user.confirmation_token) 
                    flash('Confirmation code re-sent (check console for code).', 'info')
                
                # Log the user in temporarily so they can access /confirm/code
                session['user_id'] = user.id
                session['user_type'] = user.type
                
                return redirect(url_for('confirm_code_page'))
            
            # REQUIREMENT 2: Coiffeurs must be 'active' to fully use the platform
            if user.type == 'coiffeur':
                coiffeur = Coiffeur.query.get(user.id)
                # Check for payment/trial expiration logic
                if coiffeur:
                    now = datetime.utcnow()
                    # Check if trial has expired AND status is not active (or needs renewal)
                    is_trial_expired = coiffeur.trial_end_date and coiffeur.trial_end_date < now
                    
                    if is_trial_expired:
                        # For now, just warn and let them in, but in a real app, this redirects to payment.
                        flash('Your free trial has expired. Please make a payment to continue service.', 'error')
                    
                    # The status should always be 'active' now due to FIX 2, but keep this check for future payment logic
                    if coiffeur.status != 'active':
                        flash(f'Your coiffeur account status is "{coiffeur.status}". Access is restricted until admin approval.', 'warning')
            
            session['user_id'] = user.id
            session['user_type'] = user.type
            flash('Login successful!', 'success')
            
            redirect_url = session.pop('redirect_after_login', url_for('dashboard'))
            return redirect(redirect_url)
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
# ... (logout route remains unchanged) ...
    """Logout Route - Clears session and redirects to login/index."""
    session.pop('user_id', None)
    session.pop('user_type', None)
    session.pop('redirect_after_login', None)
    flash('You have been logged out.', 'info')
    # Redirect to the new index page instead of login
    return redirect(url_for('index')) 

@app.route('/signup_client', methods=['GET', 'POST'])
def signup_client():
# ... (signup_client route remains unchanged) ...
    """Client Signup Route (MODIFIED for email confirmation)"""
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        city = request.form['city']
        phone = request.form.get('phone') 

        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('signup_client.html')

        # Generate 6-digit code (token)
        code = generate_confirmation_token()
        
        # Create user with unconfirmed status and code
        new_user = User(name=name, email=email, password=password, type='client', city=city, phone=phone,
                        is_confirmed=False, confirmation_token=code)
        db.session.add(new_user)
        db.session.commit()
        
        # Send confirmation email (with code)
        send_confirmation_email(new_user, code)
        
        flash('Client account created! Please check your email for the 6-digit code to confirm your account.', 'success')
        
        # --- FIX: Log the user in temporarily and redirect directly to confirm_code_page ---
        session['user_id'] = new_user.id
        session['user_type'] = new_user.type
        return redirect(url_for('confirm_code_page'))
        # ----------------------------------------------------------------------------------
    
    return render_template('signup_client.html')


# --- Coiffeur Signup Rework: Multi-step, Payment, and Activation (unchanged) ---
@app.route('/signup_coiffeur', methods=['GET', 'POST'])
def signup_coiffeur():
# ... (signup_coiffeur route remains unchanged) ...
    """Hairdresser Signup Route (MODIFIED for multi-step, payment, and activation)"""
    if request.method == 'GET':
        # Render the multi-step form template (HTML handles steps 1-5 client-side)
        return render_template('signup_coiffeur.html')

    # If POST, it's the final submission (Step 5: Payment and Activation)
    if request.method == 'POST':
        
        # 1. Basic Info (from hidden fields)
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        city = request.form['city']
        phone = request.form.get('phone')
        category = request.form['category']
        description = request.form['description']
        address = request.form['address']
        
        # 2. Payment Info (Step 5)
        virement_name = request.form.get('virement_name')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return redirect(url_for('signup_coiffeur'))

        # 3. Handle File Upload (Virement Proof)
        # Note: We must still handle the upload even though the trial grants immediate access.
        # This payment proof is kept for when the trial expires.
        if 'virement_proof' not in request.files:
            # We allow missing proof temporarily for the free trial but log an error or warning
            virement_proof_path = None
            flash('Warning: Payment proof was not submitted. This will be required when your 1-month trial expires.', 'warning')
        else:
            file = request.files['virement_proof']
            virement_proof_path = None
            
            if file.filename != '' and allowed_file(file.filename):
                try:
                    # Generate unique filename using email hash/timestamp
                    filename = secure_filename(file.filename)
                    ext = filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"virement_proof_{email.split('@')[0]}_{int(datetime.now().timestamp())}.{ext}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                    
                    # Save the file to the filesystem
                    file.save(filepath)
                    virement_proof_path = url_for('static', filename=f'uploads/{unique_filename}')
                except Exception as e:
                    flash(f'Failed to upload payment proof: {str(e)}', 'error')
                    return redirect(url_for('signup_coiffeur'))
            elif file.filename != '':
                 flash('Invalid file type for virement proof. Only JPG, JPEG, PNG allowed.', 'error')
                 return redirect(url_for('signup_coiffeur'))
            # else: file.filename == '' (no file uploaded)
                

        # 4. Create User and Coiffeur Profiles
        try:
            # Generate 6-digit code (token)
            code = generate_confirmation_token()

            new_user = User(
                name=name, email=email, password=password, type='coiffeur', city=city, phone=phone,
                is_confirmed=False, confirmation_token=code
            )
            db.session.add(new_user)
            db.session.flush() # Get user.id before commit

            # --- START FIX 2: Coiffeur Signup Payment Logic (Free Trial) ---
            trial_start = datetime.utcnow()
            trial_end = trial_start + timedelta(days=30)
            
            # --- NEW AVATAR LOGIC START ---
            default_avatar_map = {
                'Homme': '/static/avatar/man.png',
                'Femme': '/static/avatar/woman.png',
                'Déplacé': '/static/avatar/dep.png',
            }
            default_profile_image = default_avatar_map.get(category, '/static/uploads/default_coiffeur.png')
            # --- NEW AVATAR LOGIC END ---

            new_coiffeur = Coiffeur(
                user_id=new_user.id,
                category=category,
                description=description,
                address=address,
                virement_name=virement_name,
                virement_proof=virement_proof_path,
                profile_image=default_profile_image, # ASSIGN DEFAULT HERE
                # Initial status: We still need email confirmation first
                status='pending email confirmation', 
                # Set trial dates on creation
                trial_start_date=trial_start,
                trial_end_date=trial_end
            )
            # --- END FIX 2 ---
            
            db.session.add(new_coiffeur)
            db.session.commit()
            
            # Send confirmation email (with code)
            send_confirmation_email(new_user, code)

            flash('Hairdresser profile created! Please check your email for the 6-digit code to confirm your account. Confirmation will immediately activate your 1-month free trial.', 'success')
            
            # --- FIX: Log the user in temporarily and redirect directly to confirm_code_page ---
            session['user_id'] = new_user.id
            session['user_type'] = new_user.type
            return redirect(url_for('confirm_code_page'))
            # ----------------------------------------------------------------------------------
        
        except Exception as e:
            db.session.rollback()
            # Cleanup uploaded file if DB failed
            if virement_proof_path:
                 try:
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], virement_proof_path.split('/')[-1]))
                 except:
                    pass
            flash(f'An error occurred during registration: {str(e)}', 'error')
            return redirect(url_for('signup_coiffeur'))
    
    # Fallback/Initial GET request
    return render_template('signup_coiffeur.html')

# --- FORGOT PASSWORD WORKFLOW (NEW ROUTES) ---

@app.route('/forgot', methods=['GET', 'POST'])
def forgot_password():
    """Route 1: Forgot Password - User submits email."""
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        
        # NOTE: For security, we give a generic success message even if the user doesn't exist
        # to prevent email enumeration attacks.
        
        if user:
            # 1. Generate reset code (reuse existing 6-digit generator)
            code = generate_confirmation_token()
            
            # 2. Save the code to the user record (reuse confirmation_token field)
            user.confirmation_token = code
            db.session.commit()
            
            # 3. Send the code
            send_reset_email(user, code)
            
            # 4. Store the email in session for verification tracking
            session['reset_email'] = email
        
        # Flash message directs user to the next step
        flash('A 6-digit reset code has been sent to your email address (if an account exists).', 'success')
        
        # --- START FIX 1: Redirect to verification page (/verify-code) ---
        return redirect(url_for('verify_reset_code'))
        # --- END FIX 1 ---
            
    return render_template('forgot_password.html')

@app.route('/verify_code', methods=['GET', 'POST'])
def verify_reset_code():
    """Route 2: Verify Reset Code - User submits the 6-digit code."""
    reset_email = session.get('reset_email')
    
    # --- START FIX 1: Check if reset_email exists to ensure flow started ---
    if not reset_email:
        flash('Please start the password reset process first.', 'error')
        return redirect(url_for('forgot_password'))
    # --- END FIX 1 ---
        
    user = User.query.filter_by(email=reset_email).first()
    
    if not user or not user.confirmation_token:
        # If the user exists but the token is gone, they might need a resend.
        # This covers if the session expired or if they completed reset already.
        flash('Invalid reset session or token expired. Please restart the process.', 'error')
        session.pop('reset_email', None)
        return redirect(url_for('forgot_password'))
        
    if request.method == 'POST':
        # Retrieve the combined code from the hidden input field named 'confirmation_code'
        # The HTML provided in the previous turn uses this field:
        submitted_code = request.form.get('confirmation_code')
        
        if submitted_code == user.confirmation_token:
            # Code correct: Allow password reset (set session flag)
            session['reset_allowed'] = True
            # IMPORTANT: Keep reset_email in session until the actual reset is done
            
            flash('Code verified. You can now set a new password.', 'success')
            # CRITICAL FIX: Redirect to the reset password page
            return redirect(url_for('reset_password'))
        else:
            flash('Invalid reset code.', 'error')
            # Render the page again with an error, passing the email context
            return render_template('verify_code.html', reset_email=reset_email)

    # GET request handler
    return render_template('verify_code.html', reset_email=reset_email)

@app.route('/reset', methods=['GET', 'POST'])
def reset_password():
    """Route 3: Reset Password - User submits new password."""
    reset_email = session.get('reset_email')
    reset_allowed = session.get('reset_allowed')
    
    # Check if the user went through the verification step
    if not reset_email or not reset_allowed:
        flash('Session expired or verification failed. Please restart the process.', 'error')
        session.pop('reset_email', None)
        session.pop('reset_allowed', None)
        return redirect(url_for('forgot_password'))

    user = User.query.filter_by(email=reset_email).first()

    if not user:
        flash('User not found.', 'error')
        session.pop('reset_email', None)
        session.pop('reset_allowed', None)
        return redirect(url_for('forgot_password'))
        
    if request.method == 'POST':
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        
        if new_password != confirm_password:
            flash('The new password and confirmation password do not match.', 'error')
            # Rerender the reset page with context
            return render_template('reset_password.html')
            
        # 1. Update the user’s password (using existing mock hashing method)
        user.password = new_password
        
        # 2. Clear the reset code and session flags
        user.confirmation_token = None
        session.pop('reset_email', None)
        session.pop('reset_allowed', None)
        
        db.session.commit()
        
        flash('Your password has been reset successfully. Please log in.', 'success')
        return redirect(url_for('login'))
        
    return render_template('reset_password.html')

# --- END FORGOT PASSWORD WORKFLOW ---

# --- New Mock Admin Approval Route (rest of the file remains unchanged) ---
@app.route('/admin/approve_coiffeur/<int:coiffeur_id>')
def admin_approve_coiffeur(coiffeur_id):
# ... (all other remaining routes are unchanged) ...
    """MOCK ADMIN ROUTE: Manually approves a coiffeur after 24 hours."""
    # NOTE: In a real app, this would be protected by admin authentication
    coiffeur = Coiffeur.query.get(coiffeur_id)
    user = User.query.get(coiffeur_id)
    
    if not coiffeur or not user:
        flash(f"Coiffeur ID {coiffeur_id} not found.", 'error')
        return redirect(url_for('index'))
    
    if coiffeur.status == 'pending activation':
        # NOTE: The 24-hour check is noted but skipped here for mock functionality.
        
        coiffeur.status = 'active'
        coiffeur.activation_date = datetime.utcnow()
        db.session.commit()
        flash(f"Coiffeur {user.name} (ID: {coiffeur_id}) has been successfully activated.", 'success')
    else:
        flash(f"Coiffeur {user.name} is not in 'pending activation' status (current status: {coiffeur.status}).", 'warning')
        
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    """Dashboard - Renders client dashboard (with nearby suggestions) or coiffeur profile."""
    if not is_logged_in():
        # Redirect to the new index page instead of login, setting a redirect target
        flash('Please log in to view your dashboard.', 'error')
        session['redirect_after_login'] = url_for('dashboard')
        return redirect(url_for('index'))
    
    user = get_current_user()
    
    # CRITICAL CHECK: If logged in but not confirmed, force redirection to confirmation page
    if not user.is_confirmed:
        flash('Please enter the 6-digit code sent to your email to confirm your account.', 'warning')
        return redirect(url_for('confirm_code_page'))

    user_type = session['user_type']
    if user_type == 'client':
        # New dedicated client dashboard page (for better UI/UX + nearby suggestions)
        client_id = session['user_id']
        # Fetch client's proposals
        # IMPORTANT: Eager load the 'request' relationship to avoid N+1 queries,
        # which is likely where the error was triggered during Jinja rendering 
        # (e.g., proposal.request.service_requested)
        proposals = PriceProposal.query.options(
            joinedload(PriceProposal.request) # Eager load the request object
        ).join(
            DeplacementRequest, PriceProposal.request_id == DeplacementRequest.id
        ).filter(
            PriceProposal.client_id == client_id,
            PriceProposal.status == 'Pending'
        ).all()
        
        return render_template('client_dashboard.html', proposals=proposals)

    elif user_type == 'coiffeur':
        coiffeur_id = session['user_id']
        data = get_coiffeur_data(coiffeur_id)
        if data:
            # Coiffeur dashboard shows their own profile/management view
            # Fetch broadcast requests for 'deplace' coiffeurs, or specific requests for others (if system allowed)
            if data['coiffeur'].category == 'Déplacé':
                # Fetch all pending broadcast requests that *don't* already have a proposal from this coiffeur
                requests_query = DeplacementRequest.query.filter(
                    DeplacementRequest.status == 'Pending',
                    DeplacementRequest.target_coiffeur_id.is_(None),
                    ~DeplacementRequest.proposals.any(PriceProposal.coiffeur_id == coiffeur_id)
                ).order_by(DeplacementRequest.created_at.desc())
                data['deplacement_requests'] = requests_query.all()
            else:
                data['deplacement_requests'] = []

            return render_template('profile.html', **data, is_owner=True)
    
    return redirect(url_for('index')) # Fallback

@app.route('/api/coiffeurs/nearby', methods=['GET'])
def get_nearby_coiffeurs():
# ... (get_nearby_coiffeurs route remains unchanged) ...
    """
    API endpoint to fetch coiffeurs within a mock radius of the client's location.
    Mocking Paris center coordinates for unauthenticated users/fallbacks.
    """
    try:
        # Get client's current (mocked) location from query params
        client_lat = float(request.args.get('lat', 48.8606))
        client_lon = float(request.args.get('lon', 2.3376))
    except (ValueError, TypeError):
        client_lat = 48.8606
        client_lon = 2.3376

    # Fetch all active coiffeurs with location data
    coiffeurs_with_location = db.session.query(User, Coiffeur).join(
        Coiffeur, User.id == Coiffeur.user_id
    ).filter(
        Coiffeur.latitude.is_not(None),
        Coiffeur.longitude.is_not(None),
        Coiffeur.status == 'active'
    ).all()
    
    nearby_stylists = []
    
    for user, coiffeur in coiffeurs_with_location:
        distance = haversine(client_lat, client_lon, coiffeur.latitude, coiffeur.longitude)
        
        # Mock suggestion radius (e.g., 50 km)
        if distance < 50: 
            nearby_stylists.append({
                'id': user.id,
                'name': user.name,
                'category': coiffeur.category,
                'distance_km': round(distance, 1),
                'profile_image': coiffeur.profile_image,
                'rating': coiffeur.rating
            })
            
    # Sort by closest distance
    nearby_stylists.sort(key=lambda x: x['distance_km'])
    
    return jsonify(nearby_stylists[:10]) # Return top 10 closest
    
# NEW API ENDPOINT: Get all coiffeur locations for the map view
@app.route('/api/coiffeurs/locations', methods=['GET'])
def get_all_coiffeur_locations():
# ... (get_all_coiffeur_locations route remains unchanged) ...
    """
    API endpoint to fetch location data, address, and service details 
    for all ACTIVE stylists with defined coordinates.
    Used by the client map view (stylist_map.html).
    """
    try:
        stylist_data = db.session.query(
            User.id.label('user_id'),
            User.name.label('name'),
            Coiffeur.address.label('address'),
            Coiffeur.category.label('category'),
            Coiffeur.latitude.label('lat'),
            Coiffeur.longitude.label('lng'),
            Coiffeur.people_waiting.label('waiting_count'),
            Coiffeur.current_capacity.label('current_capacity')
        ).join(
            Coiffeur, User.id == Coiffeur.user_id
        ).filter(
            Coiffeur.latitude.is_not(None),
            Coiffeur.longitude.is_not(None),
            Coiffeur.status == 'active'
        ).all()
        
        locations = []
        for row in stylist_data:
            # Fetch services for the marker popup
            services = Service.query.filter_by(coiffeur_id=row.user_id).all()
            
            locations.append({
                'id': row.user_id,
                'name': row.name,
                'address': row.address,
                'category': row.category,
                'lat': row.lat,
                'lng': row.lng,
                'waiting_count': row.waiting_count,
                'current_capacity': row.current_capacity,
                'services': [s.service_name for s in services],
                'profile_url': url_for('view_profile', coiffeur_id=row.user_id)
            })
            
        return jsonify(locations), 200
        
    except Exception as e:
        print(f"Error fetching coiffeur locations: {e}")
        return jsonify({'error': 'Failed to fetch location data'}), 500


@app.route('/search', methods=['GET', 'POST'])
def search_stylists():
# ... (search_stylists route remains unchanged) ...
    """Client Search and Stylist List (Unchanged logic)"""
    current_user = get_current_user()
    
    # Base Query: Join User and Coiffeur, filter by active status
    query = db.session.query(User, Coiffeur).join(
        Coiffeur, User.id == Coiffeur.user_id
    ).filter(
        Coiffeur.status == 'active' # Only search active coiffeurs
    )
    
    # Filters
    city = request.args.get('city')
    category = request.args.get('category')
    sort_by = request.args.get('sort_by')

    if not sort_by:
        # Default sort when no sort is specified
        sort_by = 'rating' 

    if not city and current_user and current_user.city:
        # Default filter by current user's city if nothing is selected
        city = current_user.city

    if city:
        query = query.filter(User.city == city)
    
    if category and category != 'all':
        query = query.filter(Coiffeur.category == category)
        
    # Sorting
    if sort_by == 'rating':
        query = query.order_by(Coiffeur.rating.desc())
    elif sort_by == 'waiting':
        query = query.order_by(Coiffeur.people_waiting.asc()) 
    elif sort_by == 'mobile':
        query = query.filter(Coiffeur.category == 'Déplacé').order_by(Coiffeur.rating.desc())
        
    coiffeur_users = query.all()
    
    stylists = []
    for user, coiffeur in coiffeur_users:
        stylists.append({
            'user': user,
            'coiffeur': coiffeur,
            'rating': coiffeur.rating,
            'comment_count': coiffeur.comments_received.count()
        })

    categories = ['Femme', 'Homme', 'Déplacé']
    cities = sorted(list(set([u.city for u in User.query.all() if u.city])))

    return render_template('search.html', stylists=stylists, categories=categories, cities=cities, 
                           selected_city=city, selected_category=category, selected_sort=sort_by)

# NEW ROUTE: Map View for Clients
@app.route('/map')
def stylist_map_view():
# ... (stylist_map_view route remains unchanged) ...
    """
    Client-facing map view to show nearby stylists.
    """
    if not is_logged_in() or session['user_type'] != 'client':
        flash('You must be logged in as a client to view the map.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('stylist_map_view')
        return redirect(url_for('index'))
        
    user = get_current_user()
    if not user.is_confirmed:
        flash('Please confirm your account with the 6-digit code before viewing the map.', 'warning')
        return redirect(url_for('confirm_code_page'))

    # The actual data fetching is done via the /api/coiffeurs/locations endpoint 
    # and JavaScript on the map page. Here we just render the template.
    return render_template('stylist_map.html', map_api_key='AIzaSyCnC6H1jwZvDh4e2HOlyPuPMjsEbWzPLjI')


@app.route('/profile/<int:coiffeur_id>')
def view_profile(coiffeur_id):
# ... (view_profile route remains unchanged) ...
    """Public Hairdresser Profile View"""
    data = get_coiffeur_data(coiffeur_id)
    
    if not data:
        flash('Hairdresser not found.', 'error')
        return redirect(url_for('search_stylists'))

    # Restrict viewing if the coiffeur is not active (except for the owner)
    is_owner = (is_logged_in() and session['user_id'] == coiffeur_id)
    if not is_owner and data['coiffeur'].status != 'active':
        flash('This profile is not yet active and cannot be viewed by clients.', 'error')
        return redirect(url_for('search_stylists'))
    
    if not is_logged_in():
        session['redirect_after_login'] = url_for('view_profile', coiffeur_id=coiffeur_id)
        flash('Please log in or sign up to view the full profile.', 'info')
    else:
        # If logged in but not confirmed, force redirection to confirmation page
        if not get_current_user().is_confirmed:
            flash('Please enter the 6-digit code sent to your email to confirm your account.', 'warning')
            return redirect(url_for('confirm_code_page'))


    data['avg_rating'] = data['coiffeur'].rating

    # NEW: Fetch proposals the client received from this specific coiffeur for broadcast requests
    if current_user := get_current_user():
        if current_user.type == 'client':
            # Find proposals made by THIS coiffeur for ANY of the client's pending requests
            data['proposals_received'] = PriceProposal.query.filter(
                PriceProposal.client_id == current_user.id,
                PriceProposal.coiffeur_id == coiffeur_id,
                PriceProposal.status == 'Pending'
            ).all()

    # NOTE: Coiffeur's own Déplacement Requests are now handled on the /dashboard route
    if is_owner and data['coiffeur'].category == 'Déplacé':
        # Fetch requests that haven't been responded to by this coiffeur
        requests_query = DeplacementRequest.query.filter(
            DeplacementRequest.status == 'Pending',
            DeplacementRequest.target_coiffeur_id.is_(None),
            ~DeplacementRequest.proposals.any(PriceProposal.coiffeur_id == coiffeur_id)
        ).order_by(DeplacementRequest.created_at.desc())
        data['deplacement_requests'] = requests_query.all()

    return render_template('profile.html', **data, is_owner=is_owner)


# =========================================================================
# 3. Coiffeur Space — Add/Edit Menu Endpoints (unchanged)
# =========================================================================

@app.route('/api/coiffeur/menu', methods=['POST'])
def add_menu_item():
# ... (add_menu_item route remains unchanged) ...
    """Coiffeur: Add a new service to the menu."""
    if session.get('user_type') != 'coiffeur' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Coiffeur login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    data = request.get_json()
    coiffeur_id = session['user_id']
    
    try:
        new_item = Menu(
            coiffeur_id=coiffeur_id,
            name=data['name'],
            price=float(data['price']),
            description=data.get('description')
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({'message': 'Menu item added successfully.', 'id': new_item.id, 'name': new_item.name}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add menu item: {str(e)}'}, 500)

@app.route('/api/coiffeur/menu/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_menu_item(item_id):
# ... (manage_menu_item route remains unchanged) ...
    """Coiffeur: Edit or Delete a menu item."""
    if session.get('user_type') != 'coiffeur' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Coiffeur login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    coiffeur_id = session['user_id']
    item = Menu.query.get(item_id)
    
    if not item or item.coiffeur_id != coiffeur_id:
        return jsonify({'error': 'Menu item not found or unauthorized.'}), 404

    try:
        if request.method == 'PUT':
            data = request.get_json()
            item.name = data.get('name', item.name)
            item.price = float(data.get('price', item.price))
            item.description = data.get('description', item.description)
            db.session.commit()
            return jsonify({'message': 'Menu item updated successfully.'}), 200
            
        elif request.method == 'DELETE':
            db.session.delete(item)
            db.session.commit()
            return jsonify({'message': 'Menu item deleted successfully.'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to manage menu item: {str(e)}'}, 500)

# =========================================================================
# 2. Déplacement Request System (Only for “Coiffeur Deplace” Category) (unchanged)
# =========================================================================

# Client can make a request from a dedicated page (NOT from a coiffeur profile).
@app.route('/deplacement/new')
def new_deplacement_request_page():
# ... (new_deplacement_request_page route remains unchanged) ...
    """Client: Dedicated page to create a broadcast Déplacement Request."""
    if session.get('user_type') != 'client' or not is_logged_in():
        flash('You must be logged in as a client to make a request.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('new_deplacement_request_page')
        return redirect(url_for('index'))
        
    user = get_current_user()
    if not user.is_confirmed:
        flash('Please confirm your account with the 6-digit code before making a request.', 'warning')
        return redirect(url_for('confirm_code_page'))
    
    # Get all Déplacé coiffeurs' names for display context
    deplace_coiffeurs = db.session.query(User.name).join(Coiffeur).filter(Coiffeur.category == 'Déplacé').all()
    coiffeur_names = [name for (name,) in deplace_coiffeurs]
    
    return render_template('deplacement_request.html', coiffeur_names=coiffeur_names)


# When the client sends a request, it should go to all coiffeurs that have category = “deplace”.
@app.route('/api/deplacement/request/broadcast', methods=['POST'])
def create_deplacement_request_broadcast():
# ... (create_deplacement_request_broadcast route remains unchanged) ...
    if session.get('user_type') != 'client' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Client login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    data = request.get_json()
    client_id = session['user_id']
    
    try:
        preferred_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        preferred_time = datetime.strptime(data['time'], '%H:%M').time()
    except:
        return jsonify({'error': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM.'}), 400
        
    if not all([data.get('service'), data.get('location')]):
        return jsonify({'error': 'Missing required fields: service, location.'}), 400

    try:
        # Create a single broadcast request (target_coiffeur_id=NULL)
        new_request = DeplacementRequest(
            client_id=client_id,
            target_coiffeur_id=None, # Broadcast request
            service_requested=data['service'],
            client_location=data['location'],
            preferred_date=preferred_date,
            preferred_time=preferred_time,
            details=data.get('details'),
            status='Pending'
        )
        db.session.add(new_request)
        db.session.commit()
        
        # NOTE: The dashboard logic handles showing this request to all 'Déplacé' coiffeurs.
        
        return jsonify({'message': 'Déplacement request broadcasted successfully to all mobile stylists.', 'id': new_request.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to broadcast request: {str(e)}'}, 500)


# Coiffeur Side (Category = Deplace Only) - Make a Price Proposal
@app.route('/api/deplacement/propose/<int:request_id>', methods=['POST'])
def make_price_proposal():
# ... (make_price_proposal route remains unchanged) ...
    if session.get('user_type') != 'coiffeur' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Coiffeur login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    data = request.get_json()
    coiffeur_id = session['user_id']
    request_obj = DeplacementRequest.query.get(request_id)
    coiffeur = Coiffeur.query.get(coiffeur_id)

    # Check coiffeur category
    if coiffeur.category != 'Déplacé':
        return jsonify({'error': 'Forbidden: Only "Déplacé" coiffeurs can make proposals for broadcast requests.'}), 403

    if not request_obj or request_obj.status != 'Pending':
        return jsonify({'error': 'Request not found or not Pending.'}), 404
        
    try:
        proposed_price = float(data.get('price'))
    except:
        return jsonify({'error': 'Invalid price format.'}), 400

    try:
        # Create new proposal
        new_proposal = PriceProposal(
            request_id=request_id,
            coiffeur_id=coiffeur_id,
            client_id=request_obj.client_id, # Target the client
            proposed_price=proposed_price,
            notes=data.get('notes'),
            status='Pending'
        )
        db.session.add(new_proposal)
        
        # Don't change request status yet, only change if accepted by client
        db.session.commit()
        
        return jsonify({'message': 'Price proposal submitted successfully.', 'id': new_proposal.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to submit proposal: {str(e)}'}, 500)


# Client Response: Accept or Refuse proposal
@app.route('/api/deplacement/respond/<int:proposal_id>', methods=['POST'])
def respond_to_proposal():
# ... (respond_to_proposal route remains unchanged) ...
    if session.get('user_type') != 'client' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Client login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    data = request.get_json()
    client_id = session['user_id']
    action = data.get('action') # 'accept' or 'refuse'
    
    if action not in ['accept', 'refuse']:
        return jsonify({'error': 'Invalid action. Must be "accept" or "refuse".'}), 400
        
    proposal = PriceProposal.query.get(proposal_id)
    
    if not proposal or proposal.client_id != client_id or proposal.status != 'Pending':
        return jsonify({'error': 'Proposal not found or already acted upon.'}), 404
        
    try:
        request_obj = DeplacementRequest.query.get(proposal.request_id)
        
        if action == 'accept':
            # 1. Update Proposal status
            proposal.status = 'Accepted'
            # 2. Update Request status and set the selected coiffeur
            request_obj.status = 'Accepted'
            request_obj.target_coiffeur_id = proposal.coiffeur_id
            
            # 3. Refuse all other pending proposals for this request
            PriceProposal.query.filter(
                PriceProposal.request_id == proposal.request_id,
                PriceProposal.id != proposal.id,
                PriceProposal.status == 'Pending'
            ).update({'status': 'Refused'}, synchronize_session=False)

            db.session.commit()
            
            # Get accepted coiffeur's phone number
            accepted_coiffeur = User.query.get(proposal.coiffeur_id)
            phone_number = accepted_coiffeur.phone
            
            return jsonify({
                'message': 'Proposal accepted! Booking confirmed.', 
                'status': 'Accepted',
                'coiffeur_phone': phone_number,
                'whatsapp_link': f'https://wa.me/{phone_number}'
            }), 200
            
        elif action == 'refuse':
            # 1. Update Proposal status
            proposal.status = 'Refused'
            # 2. Request status remains 'Pending' if the client might wait for other proposals,
            # but we update it to 'Proposed' to show *at least one* response was received.
            # For simplicity, we keep the request status as 'Pending' if not accepted.
            db.session.commit() 
            
            return jsonify({'message': 'Proposal refused.', 'status': 'Refused'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process proposal response: {str(e)}'}, 500)
# =========================================================================
# End Déplacement Feature API Endpoints
# =========================================================================


# --- Existing API/Route implementations (Profile, Subscriptions, Posts, etc. - largely unchanged) ---

@app.route('/api/coiffeur/<int:coiffeur_id>/subscribe', methods=['POST', 'DELETE'])
def toggle_subscription(coiffeur_id):
# ... (toggle_subscription route remains unchanged) ...
    """Client: Subscribe/Unsubscribe to a coiffeur."""
    if session.get('user_type') != 'client' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Client login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    client_id = session['user_id']
    coiffeur = Coiffeur.query.get(coiffeur_id)
    
    if not coiffeur:
        return jsonify({'error': 'Coiffeur not found.'}), 404
        
    subscription = Subscription.query.filter_by(client_id=client_id, coiffeur_id=coiffeur_id).first()
    
    try:
        if request.method == 'POST':
            if not subscription:
                new_sub = Subscription(client_id=client_id, coiffeur_id=coiffeur_id)
                db.session.add(new_sub)
                db.session.commit()
                # FIX 4: Return updated subscriber count
                count = Subscription.query.filter_by(coiffeur_id=coiffeur_id).count()
                return jsonify({'message': 'Subscribed successfully.', 'status': 'subscribed', 'count': count}), 200
            else:
                # FIX 4: Return updated subscriber count even if already subscribed
                count = Subscription.query.filter_by(coiffeur_id=coiffeur_id).count()
                return jsonify({'message': 'Already subscribed.', 'status': 'subscribed', 'count': count}), 200
                
        elif request.method == 'DELETE':
            if subscription:
                db.session.delete(subscription)
                db.session.commit()
                # FIX 4: Return updated subscriber count
                count = Subscription.query.filter_by(coiffeur_id=coiffeur_id).count()
                return jsonify({'message': 'Unsubscribed successfully.', 'status': 'unsubscribed', 'count': count}), 200
            else:
                # FIX 4: Return updated subscriber count even if not subscribed
                count = Subscription.query.filter_by(coiffeur_id=coiffeur_id).count()
                return jsonify({'message': 'Not subscribed.', 'status': 'unsubscribed', 'count': count}), 200
                
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process subscription: {str(e)}'}, 500)

@app.route('/api/profile/upload_avatar', methods=['POST'])
def upload_avatar():
# ... (upload_avatar route remains unchanged) ...
    """
    Handles POST request for profile picture upload.
    FIX 2: Ensure file is processed and path is saved correctly.
    The original implementation looks largely correct, but we ensure the file.save()
    and db.session.commit() steps are robustly handled.
    """
    coiffeur_id = session.get('user_id')
    
    if session.get('user_type') != 'coiffeur' or not coiffeur_id:
        return jsonify({'error': 'Unauthorized: Stylist login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    if 'avatar_file' not in request.files:
        return jsonify({'error': 'No file part in the request.'}), 400
        
    file = request.files['avatar_file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            ext = filename.rsplit('.', 1)[1].lower()
            # Generate a unique filename using timestamp
            unique_filename = f"avatar_{coiffeur_id}_{int(datetime.now().timestamp())}.{ext}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Save the file to the filesystem
            file.save(filepath)
            
            coiffeur = Coiffeur.query.get(coiffeur_id)
            if coiffeur:
                public_path = url_for('static', filename=f'uploads/{unique_filename}')
                
                # Cleanup old profile image if it's not a placeholder
                # We check for the specific default paths provided in the requirement
                default_avatar_paths = [
                    '/static/avatar/man.png',
                    '/static/avatar/woman.png',
                    '/static/avatar/dep.png',
                    '/static/uploads/default_coiffeur.png'
                ]
                
                if coiffeur.profile_image and coiffeur.profile_image not in default_avatar_paths:
                    old_filename = coiffeur.profile_image.split('/')[-1]
                    # Check if the old image was in the main uploads folder (to avoid deleting avatar folder contents)
                    if not coiffeur.profile_image.startswith('/static/avatar/'): 
                        old_filepath = os.path.join(app.config['UPLOAD_FOLDER'], old_filename)
                        if os.path.exists(old_filepath):
                            try:
                                os.remove(old_filepath)
                            except OSError as e:
                                print(f"Error removing old file {old_filepath}: {e}")
                
                # Update the database field and commit
                coiffeur.profile_image = public_path
                db.session.commit()
                
                return jsonify({
                    'message': 'Profile picture uploaded successfully.',
                    'image_url': public_path
                }), 200
            
            # If coiffeur profile not found after file save, clean up the file
            os.remove(filepath)
            return jsonify({'error': 'Coiffeur profile not found.'}), 404
            
        except Exception as e:
            db.session.rollback()
            print(f"File upload error: {e}")
            return jsonify({'error': f'Server error during file save: {str(e)}'}, 500)
    
    return jsonify({'error': 'Invalid file type. Only JPG, JPEG, PNG allowed.'}), 400


@app.route('/api/publications/with_images', methods=['POST'])
def create_publication_with_images():
# ... (create_publication_with_images route remains unchanged) ...
    """
    Handles POST request for creating a new publication with multiple image files.
    FIX 2: Ensure all files are processed and JSON array is saved to the Publication model.
    The original logic looks correct, assuming the `Publication.images` field stores
    a JSON string of image paths. We reinforce the error handling.
    """
    coiffeur_id = session.get('user_id')
    
    if session.get('user_type') != 'coiffeur' or not coiffeur_id:
        return jsonify({'error': 'Unauthorized: Stylist login required.'}), 403
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    text = request.form.get('text', '').strip()
    # Use request.files.getlist to ensure all uploaded files under the 'pub_images' key are captured
    image_files = request.files.getlist('pub_images') 
    
    if not text and not image_files:
        return jsonify({'error': 'Post must contain text or at least one image.'}, 400)
    
    uploaded_image_paths = []
    
    try:
        for file in image_files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[1].lower()
                # Ensure filename uniqueness
                unique_filename = f"pub_{coiffeur_id}_{int(datetime.now().timestamp())}_{random.randint(100, 999)}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                file.save(filepath)
                
                public_path = url_for('static', filename=f'uploads/{unique_filename}')
                uploaded_image_paths.append(public_path)
            elif file.filename != '': 
                 # This should ideally not be reached if allowed_file checked, but good for validation
                 return jsonify({'error': f'Invalid file type: {file.filename}. Only JPG, JPEG, PNG allowed.'}), 400

        new_pub = Publication(
            author_id=coiffeur_id,
            text=text,
            images=json.dumps(uploaded_image_paths) if uploaded_image_paths else None # Save as JSON string or None
        )
        db.session.add(new_pub)
        db.session.commit() # Commit the new publication
        
        return jsonify({
            'message': 'Publication created and images uploaded successfully.',
            'id': new_pub.id,
            'image_urls': uploaded_image_paths
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Clean up any uploaded files if the DB transaction failed
        for path in uploaded_image_paths:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], path.split('/')[-1]))
            except:
                pass 
        print(f"Publication image upload error: {e}")
        return jsonify({'error': f'Server error during publication creation: {str(e)}'}, 500)


@app.route('/api/stylists/<int:stylist_id>', methods=['PUT'])
def update_stylist_profile_api(stylist_id):
# ... (update_stylist_profile_api route remains unchanged) ...
    """API endpoint to update stylist capacity/queue (and other profile fields)."""
    if session.get('user_type') != 'coiffeur' or session.get('user_id') != stylist_id:
        return jsonify({'error': 'Unauthorized'}, 403)
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    data = request.get_json()
    coiffeur = Coiffeur.query.get(stylist_id)
    user = User.query.get(stylist_id)

    if not coiffeur or not user:
        return jsonify({'error': 'Stylist not found'}, 404)

    try:
        user.name = data.get('display_name', user.name)
        user.city = data.get('city', user.city)

        coiffeur.description = data.get('bio', coiffeur.description)
        coiffeur.current_capacity = max(0, int(data.get('current_capacity', coiffeur.current_capacity)))
        coiffeur.people_waiting = max(0, int(data.get('waiting_count', coiffeur.people_waiting)))

        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'current_capacity': coiffeur.current_capacity,
            'waiting_count': coiffeur.people_waiting
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Update failed: {str(e)}'}, 500)


@app.route('/api/coiffeur/<int:coiffeur_id>/reservations', methods=['GET'])
def get_coiffeur_reservations(coiffeur_id):
# ... (get_coiffeur_reservations route remains unchanged) ...
    """
    API endpoint to fetch all reservations for a coiffeur.
    Requires the logged-in user to be the owner of the profile.
    """
    if not is_logged_in() or session['user_id'] != coiffeur_id:
        return jsonify({'error': 'Unauthorized access to reservations.'}), 403

    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    try:
        reservations_data = db.session.query(
            Reservation, 
            User.name.label('client_name'), 
            User.phone.label('client_phone'),
            Service.service_name.label('service_name')
        ).join(
            User, Reservation.client_id == User.id 
        ).outerjoin(
            Service, Reservation.service_id == Service.id 
        ).filter(
            Reservation.coiffeur_id == coiffeur_id
        ).order_by(
            Reservation.date.asc(), Reservation.time.asc() 
        ).all()
        
        reservations_list = []
        for reservation, client_name, client_phone, service_name in reservations_data:
            reservations_list.append({
                'id': reservation.id,
                'client_name': client_name,
                'client_phone': client_phone if client_phone else 'N/A', 
                'date': reservation.date.strftime('%Y-%m-%d'),
                'time': reservation.time.strftime('%H:%M'),
                'service': service_name if service_name else 'Unspecified', 
                'notes': reservation.notes if reservation.notes else 'None',
                'status': reservation.status
            })
            
        return jsonify(reservations_list), 200

    except Exception as e:
        print(f"Error fetching reservations: {e}")
        return jsonify({'error': f'Server error fetching reservations: {str(e)}'}, 500)
        
@app.route('/api/reservations/<int:reservation_id>/status', methods=['PUT'])
def update_reservation_status_api(reservation_id):
# ... (update_reservation_status_api route remains unchanged) ...
    """API endpoint to update the status of a specific reservation."""
    if not is_logged_in() or session['user_type'] != 'coiffeur':
        return jsonify({'error': 'Unauthorized: Only the stylist owner can manage reservations.'}), 403

    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['Pending', 'Confirmed', 'Cancelled', 'Completed']:
        return jsonify({'error': 'Invalid status provided. Must be Pending, Confirmed, Cancelled, or Completed.'}), 400

    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return jsonify({'error': 'Reservation not found.'}), 404
            
        if reservation.coiffeur_id != session['user_id']:
            return jsonify({'error': 'Forbidden: This reservation does not belong to your profile.'}), 403

        reservation.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': f'Reservation {reservation_id} status updated to {new_status} successfully.',
            'new_status': new_status
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating reservation status: {e}")
        return jsonify({'error': f'Server error updating status: {str(e)}'}, 500)

@app.route('/profile/<int:coiffeur_id>/add_comment', methods=['POST'])
def add_comment(coiffeur_id):
# ... (add_comment route remains unchanged) ...
    """
    Client: Add a general service review/comment to the coiffeur profile.
    FIX 2: Ensure form data is accessed correctly.
    """
    if session.get('user_type') != 'client':
        flash('You must be logged in as a client to leave a review.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('view_profile', coiffeur_id=coiffeur_id)
        return redirect(url_for('index'))
        
    user = get_current_user()
    if not user.is_confirmed:
        flash('Please confirm your account with the 6-digit code before leaving a review.', 'warning')
        return redirect(url_for('confirm_code_page'))

    client_id = session['user_id']
    # Ensure correct access of form data using .get()
    comment_text = request.form.get('comment_text')
    
    if not comment_text:
        flash('Review text cannot be empty.', 'error')
        return redirect(url_for('view_profile', coiffeur_id=coiffeur_id))

    try:
        new_comment = Comment(
            client_id=client_id,
            coiffeur_id=coiffeur_id,
            comment=comment_text
        )
        db.session.add(new_comment)
        db.session.commit()
        
        flash('Review submitted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        print(f"Comment submission error: {e}")
        flash('Could not submit review.', 'error')
        
    return redirect(url_for('view_profile', coiffeur_id=coiffeur_id))

@app.route('/coiffeur/location', methods=['GET'])
def manage_coiffeur_location():
# ... (manage_coiffeur_location route remains unchanged) ...
    """Coiffeur only: View location management page."""
    if session.get('user_type') != 'coiffeur':
        flash('Access denied.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('manage_coiffeur_location')
        return redirect(url_for('index'))
        
    user = get_current_user()
    if not user.is_confirmed:
        flash('Please confirm your account with the 6-digit code to manage your location.', 'warning')
        return redirect(url_for('confirm_code_page'))
        
    coiffeur = Coiffeur.query.get(session['user_id'])
    return render_template('coiffeur_location.html', coiffeur=coiffeur, map_api_key='AIzaSyCnC6H1jwZvDh4e2HOlyPuPMjsEbWzPLjI')


@app.route('/api/coiffeur/location', methods=['POST'])
def save_coiffeur_location():
# ... (save_coiffeur_location route remains unchanged) ...
    """API endpoint to save coiffeur's location (lat/lng)."""
    if session.get('user_type') != 'coiffeur':
        return jsonify({'error': 'Unauthorized'}, 403)
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    data = request.get_json()
    try:
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
    except:
        return jsonify({'error': 'Invalid latitude or longitude format'}, 400)

    if latitude is None or longitude is None:
        return jsonify({'error': 'Missing latitude or longitude'}, 400)

    try:
        coiffeur = Coiffeur.query.get(session['user_id'])
        if coiffeur:
            coiffeur.latitude = latitude
            coiffeur.longitude = longitude
            coiffeur.location_updated_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'message': 'Location updated successfully'}), 200
        
        return jsonify({'error': 'Coiffeur profile not found'}, 404)
        
    except Exception as e:
        print(f"Error saving location: {e}")
        return jsonify({'error': 'Server error saving location'}, 500)

@app.route('/reserve/<int:coiffeur_id>', methods=['GET'])
def reserve_appointment(coiffeur_id):
# ... (reserve_appointment route remains unchanged) ...
    """Client: Start reservation flow (GET)"""
    if session.get('user_type') != 'client':
        flash('You must be logged in as a client to make a reservation.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('reserve_appointment', coiffeur_id=coiffeur_id)
        return redirect(url_for('index'))
        
    user = get_current_user()
    if not user.is_confirmed:
        flash('Please confirm your account with the 6-digit code before making a reservation.', 'warning')
        return redirect(url_for('confirm_code_page'))
        
    data = get_coiffeur_data(coiffeur_id)
    if not data:
        flash('Stylist not found.', 'error')
        return redirect(url_for('search_stylists'))
    
    # FIX 1: Pass the raw Coiffeur object and the services array to the template
    return render_template('reservation.html', coiffeur=data['coiffeur'], services=data['services'])

@app.route('/reserve/<int:coiffeur_id>', methods=['POST'])
def confirm_reservation(coiffeur_id):
# ... (confirm_reservation route remains unchanged) ...
    """
    Client: Confirm reservation (POST /api/bookings mock)
    FIX 2: Ensure all form fields, especially the new 'notes' field, are correctly
    retrieved and saved to the database.
    """
    if session.get('user_type') != 'client':
        flash('Unauthorized booking attempt.', 'error')
        # Redirect to the new index page instead of login
        return redirect(url_for('index'))
        
    user = get_current_user()
    if not user.is_confirmed:
        flash('Please confirm your account with the 6-digit code before confirming a reservation.', 'warning')
        return redirect(url_for('confirm_code_page'))

    client_id = session['user_id']
    service_id = request.form['service']
    date_str = request.form['date']
    time_str = request.form['time']
    # FIX 2: Ensure 'notes' field is retrieved correctly
    notes = request.form.get('notes')
    
    try:
        service = Service.query.get(service_id)
        if not service:
            flash('Invalid service selected.', 'error')
            return redirect(url_for('reserve_appointment', coiffeur_id=coiffeur_id))
            
        new_reservation = Reservation(
            client_id=client_id,
            coiffeur_id=coiffeur_id,
            service_id=service_id,
            date=datetime.strptime(date_str, '%Y-%m-%d').date(),
            time=datetime.strptime(time_str, '%H:%M').time(),
            # FIX 2: Pass 'notes' to the model
            notes=notes,
            status='Pending'
        )
        db.session.add(new_reservation)
        db.session.commit()
        
        flash(f'Reservation confirmed! Booking ID: {new_reservation.id}. It is now "Pending confirmation" from the stylist.', 'success')
        return redirect(url_for('dashboard'))

    except Exception as e:
        db.session.rollback()
        print(f"Reservation error: {e}")
        flash('Could not create reservation. Please check your inputs.', 'error')
        return redirect(url_for('reserve_appointment', coiffeur_id=coiffeur_id))

@app.route('/api/publications/<int:pub_id>/like', methods=['POST', 'DELETE'])
def toggle_like(pub_id):
# ... (toggle_like route remains unchanged) ...
    if session.get('user_type') != 'client' and session.get('user_type') != 'coiffeur':
        return jsonify({'error': 'Authentication required'}, 401)
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    client_id = session['user_id']
    
    like = PublicationLike.query.filter_by(publication_id=pub_id, client_id=client_id).first()
    
    try:
        if request.method == 'POST':
            if not like:
                new_like = PublicationLike(publication_id=pub_id, client_id=client_id)
                db.session.add(new_like)
                db.session.commit()
                is_liked = True
            else:
                is_liked = True 
        elif request.method == 'DELETE':
            if like:
                db.session.delete(like)
                db.session.commit()
            is_liked = False
            
        likes_count = PublicationLike.query.filter_by(publication_id=pub_id).count()
        return jsonify({'likes_count': likes_count, 'liked_by_user': is_liked}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to toggle like: {str(e)}'}, 500)


@app.route('/api/publications/<int:pub_id>/comments', methods=['POST'])
def add_pub_comment(pub_id):
# ... (add_pub_comment route remains unchanged) ...
    """
    FIX 2: Ensure publication comment save logic is sound (uses JSON).
    """
    if session.get('user_type') not in ['client', 'coiffeur']:
        return jsonify({'error': 'Authentication required'}, 401)
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403
        
    # Data is expected to be JSON for an API endpoint
    data = request.get_json()
    comment_text = data.get('text', '').strip()
    client_id = session['user_id']
    
    if not comment_text or len(comment_text) > 250:
        return jsonify({'error': 'Comment must be between 1 and 250 characters.'}, 400)
        
    try:
        new_comment = PublicationComment(
            publication_id=pub_id,
            client_id=client_id,
            comment_text=comment_text
        )
        db.session.add(new_comment)
        db.session.commit()
        
        # Reloading the comment object to ensure we get the linked client name
        db.session.refresh(new_comment)
        
        return jsonify({
            'message': 'Comment added', 
            'id': new_comment.id,
            'comment_text': new_comment.comment_text,
            # Ensure client relationship is correctly resolved
            'client_name': new_comment.client.name, 
            'created_at': new_comment.created_at.strftime('%Y-%m-%d %H:%M')
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add comment: {str(e)}'}, 500)


@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_pub_comment(comment_id):
# ... (delete_pub_comment route remains unchanged) ...
    if not is_logged_in():
        return jsonify({'error': 'Authentication required'}, 401)
        
    user = get_current_user()
    if not user.is_confirmed:
        return jsonify({'error': 'Account not confirmed. Please use your 6-digit code.'}), 403

    comment = PublicationComment.query.get(comment_id)
    
    if not comment:
        return jsonify({'error': 'Comment not found'}, 404)
        
    if comment.client_id != session['user_id']:
        return jsonify({'error': 'Forbidden: You can only delete your own comments'}, 403)
        
    try:
        db.session.delete(comment)
        db.session.commit()
        return jsonify({'message': 'Comment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete comment: {str(e)}'}, 500)


if __name__ == '__main__':
    app.run(debug=True)