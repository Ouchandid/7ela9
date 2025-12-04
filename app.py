import os
import random
import json
import math
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from sqlalchemy import func, event
from sqlalchemy.orm import joinedload
from sqlalchemy.engine import Engine
from sqlalchemy import or_

# --- Configuration ---
app = Flask(__name__)

# --- NEW: Load configuration dynamically from config.py ---
from config import Config
app.config.from_object(Config) # Loads SQLALCHEMY_DATABASE_URI and SQLALCHEMY_TRACK_MODIFICATIONS
# --------------------------------------------------------

# The old hardcoded MySQL DB_CONFIG block has been removed, 
# and the DB connection is now set via app.config.from_object(Config)

app.config['SECRET_KEY'] = 'a_very_secret_and_long_key_for_myhair'
db = SQLAlchemy(app)
# ------------------------------------------

# Define file upload path (for profile and gallery images)
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Define allowed extensions for validation
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'} 

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- Utility for File Upload Validation ---
def allowed_file(filename):
    """Checks if a file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Haversine Distance Function for Mocking Nearby Search ---
def haversine(lat1, lon1, lat2, lon2):
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

# --- Database Models ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False) # Hashed in a real app
    type = db.Column(db.String(20), nullable=False)  # 'client' or 'coiffeur'
    city = db.Column(db.String(50))
    phone = db.Column(db.String(20), nullable=True) 

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
    
    services = db.relationship('Service', backref='coiffeur', lazy='dynamic')
    photos = db.relationship('Photo', backref='coiffeur', lazy='dynamic')
    comments_received = db.relationship('Comment', foreign_keys='Comment.coiffeur_id', backref='coiffeur', lazy='dynamic')
    reservations_received = db.relationship('Reservation', foreign_keys='Reservation.coiffeur_id', backref='coiffeur', lazy='dynamic')
    subscribers = db.relationship('Subscription', foreign_keys='Subscription.coiffeur_id', backref='coiffeur', lazy='dynamic')
    
    # NEW: Menu items
    menu_items = db.relationship('Menu', backref='coiffeur', lazy='dynamic')
    
    # Updated: Deplacement Requests received by this specific coiffeur (legacy structure)
    # This relationship is mainly for coiffeur-initiated requests if the system evolved.
    # For the new system, we'll use PriceProposal.

    # NEW: Price Proposals made by this coiffeur
    # FIX: Removed redundant backref='coiffeur' which conflicts with PriceProposal.coiffeur relationship below.
    made_price_proposals = db.relationship('PriceProposal', foreign_keys='PriceProposal.coiffeur_id', lazy='dynamic')

class Service(db.Model):
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
# The `target_coiffeur_id` is now the ID of the specific coiffeur who accepts
# (or null if it's a broadcast request, which is the default for 'deplace' category).
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

# --- Utility Functions ---
def get_coiffeur_data(coiffeur_id):
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
    # Check if we need to seed data (i.e., if tables are empty)
    try:
        # Check if the tables exist and are empty. If User table doesn't exist, this will fail
        # but the check in the main block handles table creation.
        if User.query.count() > 0:
            print("Database already contains data. Skipping seeding.")
            return
    except Exception as e:
        # This catches if the table is freshly created (after db.create_all) but empty, or other minor issues.
        print("Starting data seeding process.")
        pass # Continue to the seeding logic

    # 1. Clients (Added Paris coordinates for mock geolocation)
    client1 = User(name='Sarah Connor', email='sarah@client.com', password='password', type='client', city='Paris', phone='0612345678') # Mock location: 48.8606, 2.3376 (Paris Center)
    client2 = User(name='John Smith', email='john@client.com', password='password', type='client', city='Lyon', phone='0698765432')
    client3 = User(name='Alice Johnson', email='alice@client.com', password='password', type='client', city='Paris', phone='0655551111')
    db.session.add_all([client1, client2, client3])
    db.session.commit()

    # 2. Coiffeurs (Added Paris coordinates)
    coiffeur1_user = User(name='Jules Vernes', email='jules@coiffeur.com', password='password', type='coiffeur', city='Paris', phone='0140200000')
    coiffeur2_user = User(name='Marie Curie', email='marie@coiffeur.com', password='password', type='coiffeur', city='Lyon', phone='0478000000')
    coiffeur3_user = User(name='Léa Déplacé', email='lea@coiffeur.com', password='password', type='coiffeur', city='Paris', phone='0611223344')
    
    # New coiffeur for testing nearby suggestions (Closer to Paris Center 48.8606, 2.3376)
    coiffeur4_user = User(name='Pierre Proche', email='pierre@coiffeur.com', password='password', type='coiffeur', city='Paris', phone='0699887766')

    db.session.add_all([coiffeur1_user, coiffeur2_user, coiffeur3_user, coiffeur4_user])
    db.session.commit()

    # NOTE: Added latitude and longitude for seeding.
    coiffeur1 = Coiffeur(user_id=coiffeur1_user.id, category='Femme', 
                         description='Expert in balayage and long hair styles. Voted #1 in Paris.',
                         address='14 Rue de la Paix, Paris', people_waiting=4, current_capacity=2, rating=4.9,
                         latitude=48.8719, longitude=2.3308, location_updated_at=datetime.utcnow(), # Paris
                         profile_image='/static/uploads/placeholder_jules.png') 
    coiffeur2 = Coiffeur(user_id=coiffeur2_user.id, category='Homme', 
                         description='Specialist in sharp fades and classic mens cuts. Fast and precise.',
                         address='22 Place Bellecour, Lyon', people_waiting=0, current_capacity=1, rating=4.7,
                         latitude=45.7594, longitude=4.8315, location_updated_at=datetime.utcnow(), # Lyon
                         profile_image='/static/uploads/placeholder_marie.png') 
    coiffeur3 = Coiffeur(user_id=coiffeur3_user.id, category='Déplacé', 
                         description='Mobile stylist for weddings, events, and home visits in the Paris region.',
                         address='Mobile Stylist (Paris Region)', people_waiting=1, current_capacity=0, rating=4.6,
                         latitude=48.8650, longitude=2.3450, location_updated_at=datetime.utcnow(), # Paris (Déplacé)
                         profile_image='/static/uploads/placeholder_lea.png')
    coiffeur4 = Coiffeur(user_id=coiffeur4_user.id, category='Femme',
                         description='Quick cuts and vibrant coloring.',
                         address='8 Rue de Rivoli, Paris', people_waiting=2, current_capacity=1, rating=4.3,
                         latitude=48.8590, longitude=2.3480, location_updated_at=datetime.utcnow(), # Paris (Closer to Center)
                         profile_image='/static/uploads/placeholder_pierre.png')
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
    return dict(current_user=get_current_user(), now=datetime.now)


# --- MODIFIED: 1. HOME PAGE LOGIC ---
@app.route('/')
def index():
    """Renders the public index page with stylist previews."""
    # Fetch a sample of stylists for the homepage preview section.
    # This is similar to the search logic but without filters.
    
    # Base Query: Join User and Coiffeur, limit to 8 for preview
    coiffeur_users = db.session.query(User, Coiffeur).join(Coiffeur, User.id == Coiffeur.user_id).limit(8).all()
    
    stylists = []
    for user, coiffeur in coiffeur_users:
        stylists.append({
            'user': user,
            'coiffeur': coiffeur,
            'rating': coiffeur.rating,
            'comment_count': coiffeur.comments_received.count()
        })
        
    return render_template('index.html', stylists=stylists)


@app.route('/login', methods=['GET', 'POST'])
# ... (login, logout, signup routes unchanged) ...
# [Existing login, logout, signup routes here]
# --- Existing login, logout, signup routes here ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login Route"""
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email, password=password).first() # Mocking password check
        
        if user:
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
    """Logout Route - Clears session and redirects to login/index."""
    session.pop('user_id', None)
    session.pop('user_type', None)
    session.pop('redirect_after_login', None)
    flash('You have been logged out.', 'info')
    # Redirect to the new index page instead of login
    return redirect(url_for('index')) 

@app.route('/signup_client', methods=['GET', 'POST'])
def signup_client():
    """Client Signup Route"""
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        city = request.form['city']
        phone = request.form.get('phone') 

        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('signup_client.html')

        new_user = User(name=name, email=email, password=password, type='client', city=city, phone=phone)
        db.session.add(new_user)
        db.session.commit()
        
        session['user_id'] = new_user.id
        session['user_type'] = 'client'
        flash('Client account created successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('signup_client.html')

@app.route('/signup_coiffeur', methods=['GET', 'POST'])
def signup_coiffeur():
    """Hairdresser Signup Route"""
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        city = request.form['city']
        category = request.form['category']
        description = request.form['description']
        address = request.form['address']

        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('signup_coiffeur.html')

        new_user = User(name=name, email=email, password=password, type='coiffeur', city=city)
        db.session.add(new_user)
        db.session.flush()

        new_coiffeur = Coiffeur(
            user_id=new_user.id,
            category=category,
            description=description,
            address=address,
            people_waiting=0,
            current_capacity=0
        )
        db.session.add(new_coiffeur)
        db.session.commit()
        
        session['user_id'] = new_user.id
        session['user_type'] = 'coiffeur'
        flash('Hairdresser profile created successfully! You can now add services and photos.', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('signup_coiffeur.html')

# --- 2. CLIENT SPACE IMPROVEMENTS (Dashboard Rework) ---
@app.route('/dashboard')
def dashboard():
    """Dashboard - Renders client dashboard (with nearby suggestions) or coiffeur profile."""
    if not is_logged_in():
        # Redirect to the new index page instead of login, setting a redirect target
        flash('Please log in to view your dashboard.', 'error')
        session['redirect_after_login'] = url_for('dashboard')
        return redirect(url_for('index'))
    
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
# ----------------------------------------------------


# --- NEW API ENDPOINT: Nearby Coiffeur Suggestions (Step 1) ---
@app.route('/api/coiffeurs/nearby', methods=['GET'])
def get_nearby_coiffeurs():
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

    # Fetch all coiffeurs with location data
    coiffeurs_with_location = db.session.query(User, Coiffeur).join(
        Coiffeur, User.id == Coiffeur.user_id
    ).filter(
        Coiffeur.latitude.is_not(None),
        Coiffeur.longitude.is_not(None)
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
    """
    API endpoint to fetch location data, address, and service details 
    for all stylists with defined coordinates.
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
            Coiffeur.longitude.is_not(None)
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
    """Client Search and Stylist List (Unchanged logic)"""
    # ... [Existing search_stylists function logic] ...
    current_user = get_current_user()
    
    # Base Query: Join User and Coiffeur
    query = db.session.query(User, Coiffeur).join(Coiffeur, User.id == Coiffeur.user_id)
    
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
    """
    Client-facing map view to show nearby stylists.
    """
    if not is_logged_in() or session['user_type'] != 'client':
        flash('Please log in as a client to view the map.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('stylist_map_view')
        return redirect(url_for('index'))
        
    # The actual data fetching is done via the /api/coiffeurs/locations endpoint 
    # and JavaScript on the map page. Here we just render the template.
    return render_template('stylist_map.html', map_api_key='AIzaSyCnC6H1jwZvDh4e2HOlyPuPMjsEbWzPLjI')


@app.route('/profile/<int:coiffeur_id>')
def view_profile(coiffeur_id):
    """Public Hairdresser Profile View"""
    data = get_coiffeur_data(coiffeur_id)
    
    if not data:
        flash('Hairdresser not found.', 'error')
        return redirect(url_for('search_stylists'))
    
    if not is_logged_in():
        session['redirect_after_login'] = url_for('view_profile', coiffeur_id=coiffeur_id)
        flash('Please log in or sign up to view the full profile.', 'info')

    is_owner = (is_logged_in() and session['user_id'] == coiffeur_id)
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
# 3. Coiffeur Space — Add/Edit Menu Endpoints
# =========================================================================

@app.route('/api/coiffeur/menu', methods=['POST'])
def add_menu_item():
    """Coiffeur: Add a new service to the menu."""
    if session.get('user_type') != 'coiffeur' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Coiffeur login required.'}), 403
        
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
        return jsonify({'error': f'Failed to add menu item: {str(e)}'}), 500

@app.route('/api/coiffeur/menu/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_menu_item(item_id):
    """Coiffeur: Edit or Delete a menu item."""
    if session.get('user_type') != 'coiffeur' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Coiffeur login required.'}), 403
        
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
        return jsonify({'error': f'Failed to manage menu item: {str(e)}'}), 500

# =========================================================================
# 2. Déplacement Request System (Only for “Coiffeur Deplace” Category)
# =========================================================================

# Client can make a request from a dedicated page (NOT from a coiffeur profile).
@app.route('/deplacement/new')
def new_deplacement_request_page():
    """Client: Dedicated page to create a broadcast Déplacement Request."""
    if session.get('user_type') != 'client' or not is_logged_in():
        flash('You must be logged in as a client to make a request.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('new_deplacement_request_page')
        return redirect(url_for('index'))
    
    # Get all Déplacé coiffeurs' names for display context
    deplace_coiffeurs = db.session.query(User.name).join(Coiffeur).filter(Coiffeur.category == 'Déplacé').all()
    coiffeur_names = [name for (name,) in deplace_coiffeurs]
    
    return render_template('deplacement_request.html', coiffeur_names=coiffeur_names)


# When the client sends a request, it should go to all coiffeurs that have category = “deplace”.
@app.route('/api/deplacement/request/broadcast', methods=['POST'])
def create_deplacement_request_broadcast():
    if session.get('user_type') != 'client' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Client login required.'}), 403
        
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
        return jsonify({'error': f'Failed to broadcast request: {str(e)}'}), 500


# Coiffeur Side (Category = Deplace Only) - Make a Price Proposal
@app.route('/api/deplacement/propose/<int:request_id>', methods=['POST'])
def make_price_proposal():
    if session.get('user_type') != 'coiffeur' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Coiffeur login required.'}), 403
        
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
        return jsonify({'error': f'Failed to submit proposal: {str(e)}'}), 500


# Client Response: Accept or Refuse proposal
@app.route('/api/deplacement/respond/<int:proposal_id>', methods=['POST'])
def respond_to_proposal():
    if session.get('user_type') != 'client' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Client login required.'}), 403
        
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
            # If all are refused, it stays 'Pending' until expiry or manual cancellation.
            # For simplicity, we keep the request status as 'Pending' if not accepted.
            db.session.commit() 
            
            return jsonify({'message': 'Proposal refused.', 'status': 'Refused'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process proposal response: {str(e)}'}), 500
# =========================================================================
# End Déplacement Feature API Endpoints
# =========================================================================


# --- Existing API/Route implementations (Profile, Subscriptions, Posts, etc. - largely unchanged) ---

@app.route('/api/coiffeur/<int:coiffeur_id>/subscribe', methods=['POST', 'DELETE'])
def toggle_subscription(coiffeur_id):
    """Client: Subscribe/Unsubscribe to a coiffeur."""
    # ... [Existing toggle_subscription logic] ...
    if session.get('user_type') != 'client' or not is_logged_in():
        return jsonify({'error': 'Unauthorized: Client login required.'}), 403
        
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
    """
    Handles POST request for profile picture upload.
    FIX 2: Ensure file is processed and path is saved correctly.
    The original implementation looks largely correct, but we ensure the file.save()
    and db.session.commit() steps are robustly handled.
    """
    coiffeur_id = session.get('user_id')
    
    if session.get('user_type') != 'coiffeur' or not coiffeur_id:
        return jsonify({'error': 'Unauthorized: Stylist login required.'}), 403

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
                if coiffeur.profile_image and not coiffeur.profile_image.startswith('/static/uploads/placeholder'):
                    old_filename = coiffeur.profile_image.split('/')[-1]
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
            return jsonify({'error': f'Server error during file save: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type. Only JPG, JPEG, PNG allowed.'}), 400


@app.route('/api/publications/with_images', methods=['POST'])
def create_publication_with_images():
    """
    Handles POST request for creating a new publication with multiple image files.
    FIX 2: Ensure all files are processed and JSON array is saved to the Publication model.
    The original logic looks correct, assuming the `Publication.images` field stores
    a JSON string of image paths. We reinforce the error handling.
    """
    coiffeur_id = session.get('user_id')
    
    if session.get('user_type') != 'coiffeur' or not coiffeur_id:
        return jsonify({'error': 'Unauthorized: Stylist login required.'}), 403

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
        return jsonify({'error': f'Server error during publication creation: {str(e)}'}), 500


@app.route('/api/stylists/<int:stylist_id>', methods=['PUT'])
def update_stylist_profile_api(stylist_id):
    """API endpoint to update stylist capacity/queue (and other profile fields)."""
    # ... [Existing update_stylist_profile_api logic] ...
    if session.get('user_type') != 'coiffeur' or session.get('user_id') != stylist_id:
        return jsonify({'error': 'Unauthorized'}, 403)

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
    """
    API endpoint to fetch all reservations for a coiffeur.
    Requires the logged-in user to be the owner of the profile.
    """
    if not is_logged_in() or session['user_id'] != coiffeur_id:
        return jsonify({'error': 'Unauthorized access to reservations.'}), 403

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
        return jsonify({'error': f'Server error fetching reservations: {str(e)}'}), 500
        
@app.route('/api/reservations/<int:reservation_id>/status', methods=['PUT'])
def update_reservation_status_api(reservation_id):
    """API endpoint to update the status of a specific reservation."""
    if not is_logged_in() or session['user_type'] != 'coiffeur':
        return jsonify({'error': 'Unauthorized: Only the stylist owner can manage reservations.'}), 403

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
        return jsonify({'error': f'Server error updating status: {str(e)}'}), 500

@app.route('/profile/<int:coiffeur_id>/add_comment', methods=['POST'])
def add_comment(coiffeur_id):
    """
    Client: Add a general service review/comment to the coiffeur profile.
    FIX 2: Ensure form data is accessed correctly.
    """
    if session.get('user_type') != 'client':
        flash('You must be logged in as a client to leave a review.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('view_profile', coiffeur_id=coiffeur_id)
        return redirect(url_for('index'))

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
    """Coiffeur only: View location management page."""
    if session.get('user_type') != 'coiffeur':
        flash('Access denied.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('manage_coiffeur_location')
        return redirect(url_for('index'))
        
    coiffeur = Coiffeur.query.get(session['user_id'])
    return render_template('coiffeur_location.html', coiffeur=coiffeur, map_api_key='AIzaSyCnC6H1jwZvDh4e2HOlyPuPMjsEbWzPLjI')


@app.route('/api/coiffeur/location', methods=['POST'])
def save_coiffeur_location():
    """API endpoint to save coiffeur's location (lat/lng)."""
    if session.get('user_type') != 'coiffeur':
        return jsonify({'error': 'Unauthorized'}, 403)
        
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
    """Client: Start reservation flow (GET)"""
    if session.get('user_type') != 'client':
        flash('You must be logged in as a client to make a reservation.', 'error')
        # Redirect to the new index page instead of login
        session['redirect_after_login'] = url_for('reserve_appointment', coiffeur_id=coiffeur_id)
        return redirect(url_for('index'))
        
    data = get_coiffeur_data(coiffeur_id)
    if not data:
        flash('Stylist not found.', 'error')
        return redirect(url_for('search_stylists'))
    
    # FIX 1: Pass the raw Coiffeur object and the services array to the template
    return render_template('reservation.html', coiffeur=data['coiffeur'], services=data['services'])

@app.route('/reserve/<int:coiffeur_id>', methods=['POST'])
def confirm_reservation(coiffeur_id):
    """
    Client: Confirm reservation (POST /api/bookings mock)
    FIX 2: Ensure all form fields, especially the new 'notes' field, are correctly
    retrieved and saved to the database.
    """
    if session.get('user_type') != 'client':
        flash('Unauthorized booking attempt.', 'error')
        # Redirect to the new index page instead of login
        return redirect(url_for('index'))

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
    if session.get('user_type') != 'client' and session.get('user_type') != 'coiffeur':
        return jsonify({'error': 'Authentication required'}, 401)
        
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
    """
    FIX 2: Ensure publication comment save logic is sound (uses JSON).
    """
    if session.get('user_type') not in ['client', 'coiffeur']:
        return jsonify({'error': 'Authentication required'}, 401)
        
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
    if not is_logged_in():
        return jsonify({'error': 'Authentication required'}, 401)

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