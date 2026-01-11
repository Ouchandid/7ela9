import os
import random
import json
import math
from datetime import datetime, timedelta
# Import secrets for token generation and mail sending mock
from flask import Flask, request, session, jsonify, send_from_directory, abort, redirect
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from sqlalchemy import func, event
from sqlalchemy.orm import joinedload
from sqlalchemy.engine import Engine
from sqlalchemy import or_
import secrets
from flask_mail import Mail, Message
from flask_cors import CORS  # NEW: Import CORS

# --- Configuration ---
app = Flask(__name__, static_folder='static', static_url_path='/static')

# --- NEW: Enable CORS for all routes (allows React frontend to fetch data) ---
# Updated to support credentials (cookies) for session management
CORS(app, supports_credentials=True)

# --- NEW: Load configuration dynamically from config.py ---
try:
    from config import Config
    app.config.from_object(Config)
except ImportError:
    # Fallback if config.py is missing in this context
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --------------------------------------------------------

app.config['SECRET_KEY'] = 'a_very_secret_and_long_key_for_myhair'

# --- EMAIL CONFIGURATION ---
app.config['MAIL_SERVER'] = 'mail.spacemail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'contact@7ela9.com'
app.config['MAIL_PASSWORD'] = 'dc9dnn9W@'
app.config['MAIL_DEFAULT_SENDER'] = 'contact@7ela9.com'
# ------------------------------------------------------------------------

db = SQLAlchemy(app)
mail = Mail(app)

# Define file upload path
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'} 

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- Utility for File Upload Validation ---
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Utility Functions for Email ---

def generate_confirmation_token():
    return ''.join(random.choices('0123456789', k=6))

def send_confirmation_email(user, code):
    try:
        msg = Message(
            'Your 7ela9 Account Confirmation Code',
            recipients=[user.email],
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        msg.body = f"Dear {user.name},\n\nYour 6-digit code is:\n\nCODE: {code}\n\n"
        mail.send(msg)
    except Exception as e:
        print(f"ERROR: EMAIL SENDING FAILED ({e}) - CODE: {code}")
    return code

def send_reset_email(user, code):
    try:
        msg = Message(
            'Your 7ela9 Password Reset Code',
            recipients=[user.email],
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        msg.body = f"Dear {user.name},\n\nYour reset code is:\n\nCODE: {code}\n\n"
        mail.send(msg)
    except Exception as e:
        print(f"ERROR: EMAIL SENDING FAILED ({e}) - CODE: {code}")
    return code


# --- Haversine Distance Function ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371 # Earth radius in kilometers
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# --- Database Models ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'client' or 'coiffeur'
    city = db.Column(db.String(50))
    phone = db.Column(db.String(20), nullable=True) 

    is_confirmed = db.Column(db.Boolean, default=False)
    confirmation_token = db.Column(db.String(100), nullable=True, unique=True) 
    
    coiffeur = db.relationship('Coiffeur', backref='user', uselist=False)
    comments_made = db.relationship('Comment', foreign_keys='Comment.client_id', backref='client', lazy='dynamic')
    reservations_made = db.relationship('Reservation', foreign_keys='Reservation.client_id', backref='client', lazy='dynamic')
    publications_made = db.relationship('Publication', foreign_keys='Publication.author_id', backref='author', lazy='dynamic')
    likes_made = db.relationship('PublicationLike', foreign_keys='PublicationLike.client_id', backref='client', lazy='dynamic')
    pub_comments_made = db.relationship('PublicationComment', foreign_keys='PublicationComment.client_id', backref='client', lazy='dynamic')
    subscriptions = db.relationship('Subscription', foreign_keys='Subscription.client_id', backref='client', lazy='dynamic')
    
    created_deplacement_requests = db.relationship('DeplacementRequest', foreign_keys='DeplacementRequest.client_id', backref='client', lazy='dynamic')

class Coiffeur(db.Model):
    __tablename__ = 'coiffeurs'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    profile_image = db.Column(db.String(200), default='/static/uploads/default_coiffeur.png')
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(200))
    people_waiting = db.Column(db.Integer, default=0)
    current_capacity = db.Column(db.Integer, default=0) 
    rating = db.Column(db.Float, default=4.5)
    
    latitude = db.Column(db.Float(precision=8), nullable=True)
    longitude = db.Column(db.Float(precision=8), nullable=True)
    location_updated_at = db.Column(db.DateTime, nullable=True)
    
    status = db.Column(db.String(50), default='pending email confirmation')
    virement_name = db.Column(db.String(100), nullable=True) 
    virement_proof = db.Column(db.String(200), nullable=True) 
    activation_date = db.Column(db.DateTime, nullable=True)
    
    trial_start_date = db.Column(db.DateTime, nullable=True)
    trial_end_date = db.Column(db.DateTime, nullable=True)

    services = db.relationship('Service', backref='coiffeur', lazy='dynamic')
    photos = db.relationship('Photo', backref='coiffeur', lazy='dynamic')
    comments_received = db.relationship('Comment', foreign_keys='Comment.coiffeur_id', backref='coiffeur', lazy='dynamic')
    reservations_received = db.relationship('Reservation', foreign_keys='Reservation.coiffeur_id', backref='coiffeur', lazy='dynamic')
    subscribers = db.relationship('Subscription', foreign_keys='Subscription.coiffeur_id', backref='coiffeur', lazy='dynamic')
    menu_items = db.relationship('Menu', backref='coiffeur', lazy='dynamic')
    made_price_proposals = db.relationship('PriceProposal', foreign_keys='PriceProposal.coiffeur_id', lazy='dynamic')

class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False)
    service_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

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
    likes = db.Column(db.Integer, default=0) 

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
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True) 
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    notes = db.Column(db.Text, nullable=True) 
    status = db.Column(db.String(50), default='Pending') 
    
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

class DeplacementRequest(db.Model):
    __tablename__ = 'deplacement_requests'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    target_coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=True) 
    
    service_requested = db.Column(db.String(100), nullable=False)
    client_location = db.Column(db.String(200), nullable=False)
    preferred_date = db.Column(db.Date, nullable=False)
    preferred_time = db.Column(db.Time, nullable=False)
    details = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Pending') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    proposals = db.relationship('PriceProposal', backref='request', lazy='dynamic', cascade="all, delete-orphan")

class PriceProposal(db.Model):
    __tablename__ = 'price_proposals'
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('deplacement_requests.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeurs.user_id'), nullable=False) 
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) 
    proposed_price = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Pending') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    coiffeur = db.relationship('Coiffeur', backref='received_proposals', foreign_keys=[coiffeur_id])

# --- Helper Logic ---
def get_current_user():
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

def is_logged_in():
    return 'user_id' in session

def get_coiffeur_data(coiffeur_id):
    """Fetches all necessary data for a coiffeur profile."""
    coiffeur = Coiffeur.query.options(joinedload(Coiffeur.user)).get(coiffeur_id)
    
    if coiffeur:
        services = Service.query.filter_by(coiffeur_id=coiffeur_id).all()
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
            # Fetch comments for publication
            pub_comments = db.session.query(
                PublicationComment, User.name
            ).join(
                User, PublicationComment.client_id == User.id
            ).filter(
                PublicationComment.publication_id == pub.id
            ).order_by(
                PublicationComment.created_at.asc()
            ).all()

            pub_data['comments'] = [{
                'id': c.PublicationComment.id,
                'text': c.PublicationComment.comment_text,
                'user': c.name,
                'created_at': c.PublicationComment.created_at
            } for c in pub_comments]

            if client_id:
                pub_data['liked_by_user'] = PublicationLike.query.filter_by(publication_id=pub.id, client_id=client_id).first() is not None
            
            publications.append(pub_data)

        subscriber_count = Subscription.query.filter_by(coiffeur_id=coiffeur_id).count()

        return {
            'user': coiffeur.user,
            'coiffeur': coiffeur,
            'services': services,
            'menu_items': menu_items, 
            'photos': Photo.query.filter_by(coiffeur_id=coiffeur_id).all(),
            'comments': comments,
            'publications': publications,
            'is_subscribed': is_subscribed,
            'subscriber_count': subscriber_count 
        }
    return None

def seed_db():
    try:
        if User.query.count() > 0:
            print("Database already contains data. Skipping seeding.")
            return
    except Exception as e:
        pass 

    # Seeding logic preserved for dev
    client1 = User(name='Sarah Connor', email='sarah@client.com', password='password', type='client', city='Paris', phone='0612345678', is_confirmed=True) 
    client2 = User(name='John Smith', email='john@client.com', password='password', type='client', city='Lyon', phone='0698765432', is_confirmed=True)
    db.session.add_all([client1, client2])
    db.session.commit()
    # ... (abbreviated for brevity, normally you'd keep full seed logic)
    print("Database seeded.")

with app.app_context():
    db.create_all() 
    seed_db()


# ==========================================
#               API ENDPOINTS
# ==========================================

# --- AUTHENTICATION API ---

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    # Handle both JSON and Form Data (frontend uses Form Post for login)
    email = None
    password = None
    
    if request.is_json:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
    else:
        email = request.form.get('email')
        password = request.form.get('password')
    
    user = User.query.filter_by(email=email, password=password).first() 
    
    if user:
        session['user_id'] = user.id
        session['user_type'] = user.type
        
        # Check trial status for coiffeurs
        warning = None
        if user.type == 'coiffeur':
            coiffeur = Coiffeur.query.get(user.id)
            if coiffeur and coiffeur.trial_end_date and coiffeur.trial_end_date < datetime.utcnow():
                warning = 'Trial expired'
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'name': user.name,
                'type': user.type,
                'is_confirmed': user.is_confirmed
            },
            'warning': warning
        }), 200
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/auth/logout', methods=['POST', 'GET']) # Allow GET for simple link logout
def api_logout():
    session.pop('user_id', None)
    session.pop('user_type', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/auth/signup/client', methods=['POST'])
def api_signup_client():
    data = request.get_json()
    # Handle case where it might be form data
    if not data and request.form:
        data = request.form

    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already registered'}), 400

    code = generate_confirmation_token()
    new_user = User(
        name=data.get('name'), 
        email=data.get('email'), 
        password=data.get('password'), 
        type='client', 
        city=data.get('city'), 
        phone=data.get('phone'),
        is_confirmed=False, 
        confirmation_token=code
    )
    db.session.add(new_user)
    db.session.commit()
    
    send_confirmation_email(new_user, code)
    
    session['user_id'] = new_user.id
    session['user_type'] = new_user.type
    return jsonify({'message': 'Account created', 'userId': new_user.id}), 201

@app.route('/api/auth/signup/coiffeur', methods=['POST'])
def api_signup_coiffeur():
    # Uses Form Data for file upload
    email = request.form.get('email')
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    virement_proof_path = None
    if 'virement_proof' in request.files:
        file = request.files['virement_proof']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"virement_{email.split('@')[0]}_{int(datetime.now().timestamp())}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            virement_proof_path = f'/static/uploads/{unique_filename}'
    
    try:
        code = generate_confirmation_token()
        new_user = User(
            name=request.form.get('name'), 
            email=email, 
            password=request.form.get('password'), 
            type='coiffeur', 
            city=request.form.get('city'), 
            phone=request.form.get('phone'),
            is_confirmed=False, 
            confirmation_token=code
        )
        db.session.add(new_user)
        db.session.flush()

        category = request.form.get('category')
        default_img = '/static/uploads/default_coiffeur.png'
        if category == 'Homme': default_img = '/static/avatar/man.png'
        elif category == 'Femme': default_img = '/static/avatar/woman.png'
        elif category == 'Déplacé': default_img = '/static/avatar/dep.png'

        trial_start = datetime.utcnow()
        new_coiffeur = Coiffeur(
            user_id=new_user.id,
            category=category,
            description=request.form.get('description'),
            address=request.form.get('address'),
            virement_name=request.form.get('virement_name'),
            virement_proof=virement_proof_path,
            profile_image=default_img,
            status='pending email confirmation',
            trial_start_date=trial_start,
            trial_end_date=trial_start + timedelta(days=30)
        )
        db.session.add(new_coiffeur)
        db.session.commit()
        
        send_confirmation_email(new_user, code)
        session['user_id'] = new_user.id
        session['user_type'] = new_user.type
        return jsonify({'message': 'Account created', 'userId': new_user.id}), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/confirm', methods=['POST'])
def api_confirm_email():
    if not is_logged_in():
        return jsonify({'error': 'Login required'}), 401
    
    user = get_current_user()
    data = request.get_json()
    submitted_code = data.get('code')
    
    if submitted_code and submitted_code == user.confirmation_token:
        user.is_confirmed = True
        user.confirmation_token = None
        
        if user.type == 'coiffeur':
            coiffeur = Coiffeur.query.get(user.id)
            if coiffeur and coiffeur.status == 'pending email confirmation':
                coiffeur.status = 'active'
                coiffeur.activation_date = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'message': 'Account confirmed successfully'}), 200
    
    return jsonify({'error': 'Invalid code'}), 400

@app.route('/api/auth/forgot', methods=['POST'])
def api_forgot_password():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user:
        code = generate_confirmation_token()
        user.confirmation_token = code
        db.session.commit()
        send_reset_email(user, code)
        return jsonify({'message': 'Reset code sent'}), 200
    return jsonify({'message': 'If account exists, code sent'}), 200

@app.route('/api/auth/reset', methods=['POST'])
def api_reset_password():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')
    
    user = User.query.filter_by(email=email).first()
    if user and user.confirmation_token == code:
        user.password = new_password
        user.confirmation_token = None
        db.session.commit()
        return jsonify({'message': 'Password reset successfully'}), 200
    
    return jsonify({'error': 'Invalid email or code'}), 400


# --- DATA & LOGIC API ---

@app.route('/api/me', methods=['GET'])
def api_me():
    user = get_current_user()
    if user:
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'type': user.type,
            'city': user.city,
            'isConfirmed': user.is_confirmed,
            'image': user.coiffeur.profile_image if user.type == 'coiffeur' and user.coiffeur else None
        })
    return jsonify(None), 401

@app.route('/api/dashboard', methods=['GET'])
def api_dashboard_data():
    if not is_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = get_current_user()
    response = {}

    if user.type == 'client':
        proposals = PriceProposal.query.options(joinedload(PriceProposal.request)).join(
            DeplacementRequest
        ).filter(
            PriceProposal.client_id == user.id,
            PriceProposal.status == 'Pending'
        ).all()
        
        response['proposals'] = [{
            'id': p.id,
            'proposed_price': p.proposed_price,
            'notes': p.notes,
            'service': p.request.service_requested,
            'coiffeur_name': p.coiffeur.user.name
        } for p in proposals]
        
    elif user.type == 'coiffeur':
        data = get_coiffeur_data(user.id)
        if data:
            response['profile'] = {
                'category': data['coiffeur'].category,
                'rating': data['coiffeur'].rating,
                'capacity': data['coiffeur'].current_capacity,
                'waiting': data['coiffeur'].people_waiting
            }
            if data['coiffeur'].category == 'Déplacé':
                requests = DeplacementRequest.query.filter(
                    DeplacementRequest.status == 'Pending',
                    DeplacementRequest.target_coiffeur_id.is_(None),
                    ~DeplacementRequest.proposals.any(PriceProposal.coiffeur_id == user.id)
                ).all()
                response['deplacement_requests'] = [{
                    'id': r.id,
                    'service': r.service_requested,
                    'location': r.client_location,
                    'date': str(r.preferred_date),
                    'time': str(r.preferred_time)
                } for r in requests]

    return jsonify(response)

@app.route('/api/stylists', methods=['GET'])
def api_get_stylists():
    # Support search params
    city = request.args.get('city')
    category = request.args.get('category')
    sort_by = request.args.get('sort_by', 'rating')
    
    query = db.session.query(User, Coiffeur).join(Coiffeur, User.id == Coiffeur.user_id).filter(Coiffeur.status == 'active')
    
    if city:
        query = query.filter(User.city == city)
    if category and category != 'all':
        query = query.filter(Coiffeur.category == category)
    
    if sort_by == 'waiting':
        query = query.order_by(Coiffeur.people_waiting.asc())
    else:
        query = query.order_by(Coiffeur.rating.desc())
        
    results = query.all()
    
    stylists = []
    for user, coiffeur in results:
        stylists.append({
            'id': user.id,
            'name': user.name,
            'category': coiffeur.category,
            'city': user.city,
            'rating': coiffeur.rating,
            'image': coiffeur.profile_image,
            'description': coiffeur.description,
            'capacity': coiffeur.current_capacity,
            'waiting': coiffeur.people_waiting,
            'lat': coiffeur.latitude,
            'lng': coiffeur.longitude
        })
    return jsonify(stylists)

# --- UPDATED: Route to get a single stylist by ID (matches URL /api/stylists/<int:stylist_id>) ---
# --- ADDED: PUT method to update stylist status (waiting queue) ---
@app.route('/api/stylists/<int:stylist_id>', methods=['GET', 'PUT'])
def api_get_stylist_detail(stylist_id):
    if request.method == 'PUT':
        if not is_logged_in() or session['user_id'] != stylist_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        coiffeur = Coiffeur.query.get(stylist_id)
        if 'waiting_count' in data:
            coiffeur.people_waiting = data['waiting_count']
        
        db.session.commit()
        return jsonify({'message': 'Updated'}), 200

    data = get_coiffeur_data(stylist_id)
    if not data:
        return jsonify({'error': 'Stylist not found'}), 404
        
    coiffeur = data['coiffeur']
    user = data['user']
    
    photos = [p.image_path for p in data['photos']]
    menu = [{'id': m.id, 'name': m.name, 'price': m.price, 'description': m.description} for m in data['menu_items']]
    services = [{'id': s.id, 'name': s.service_name, 'price': s.price} for s in data['services']]
    
    feed = []
    for pub in data['publications']:
        feed.append({
            'id': pub['id'],
            'text': pub['text'],
            'images': pub['images'],
            'created_at': pub['created_at'].strftime('%Y-%m-%d'),
            'likes': pub['likes_count'],
            'comments': pub['comments'],
            'liked_by_user': pub['liked_by_user']
        })

    return jsonify({
        'id': user.id,
        'name': user.name,
        'category': coiffeur.category,
        'city': user.city,
        'rating': coiffeur.rating,
        'image': coiffeur.profile_image,
        'description': coiffeur.description,
        'address': coiffeur.address,
        'capacity': coiffeur.current_capacity,
        'waiting': coiffeur.people_waiting,
        'images': photos,
        'menu': menu,
        'services': services,
        'feed': feed,
        'is_subscribed': data['is_subscribed'],
        'subscriber_count': data['subscriber_count']
    })

@app.route('/api/stylists/<int:id>/comment', methods=['POST'])
def api_add_stylist_comment(id):
    if not is_logged_in() or session['user_type'] != 'client':
        return jsonify({'error': 'Client login required'}), 403
    
    data = request.get_json()
    new_comment = Comment(
        client_id=session['user_id'],
        coiffeur_id=id,
        comment=data.get('comment')
    )
    db.session.add(new_comment)
    db.session.commit()
    return jsonify({'message': 'Comment added'}), 201

# --- UPDATED: Reserve route handling form data from URL /api/reserve/<id> ---
@app.route('/api/reserve/<int:coiffeur_id>', methods=['POST'])
def api_reserve_form(coiffeur_id):
    if not is_logged_in():
        return jsonify({'error': 'Login required'}), 403
    
    # Handle form data
    if request.form:
        data = request.form
    else:
        data = request.get_json()
        
    try:
        # Determine service id if passed, otherwise default to None
        service_id = data.get('service') if data.get('service') else None
        
        new_res = Reservation(
            client_id=session['user_id'],
            coiffeur_id=coiffeur_id,
            service_id=service_id,
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=datetime.strptime(data['time'], '%H:%M').time(),
            notes=data.get('notes'),
            status='Pending'
        )
        db.session.add(new_res)
        db.session.commit()
        return jsonify({'message': 'Reservation submitted', 'id': new_res.id}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400

@app.route('/api/reserve', methods=['POST'])
def api_reserve():
    if not is_logged_in() or session['user_type'] != 'client':
        return jsonify({'error': 'Client login required'}), 403
    
    data = request.get_json()
    try:
        new_res = Reservation(
            client_id=session['user_id'],
            coiffeur_id=data['coiffeur_id'],
            service_id=data.get('service_id'),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=datetime.strptime(data['time'], '%H:%M').time(),
            notes=data.get('notes'),
            status='Pending'
        )
        db.session.add(new_res)
        db.session.commit()
        return jsonify({'message': 'Reservation submitted', 'id': new_res.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# --- ADDED: Fetch reservations for a coiffeur dashboard ---
@app.route('/api/coiffeur/<int:id>/reservations', methods=['GET'])
def api_get_coiffeur_reservations(id):
    if not is_logged_in() or session['user_id'] != id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    reservations = Reservation.query.filter_by(coiffeur_id=id).order_by(Reservation.date, Reservation.time).all()
    
    res_list = []
    for r in reservations:
        res_list.append({
            'id': r.id,
            'client_name': r.client.name,
            'service': r.service_detail.service_name if r.service_detail else 'General',
            'date': str(r.date),
            'time': str(r.time),
            'status': r.status,
            'notes': r.notes
        })
    return jsonify(res_list)

@app.route('/api/coiffeur/menu', methods=['POST'])
def api_add_menu():
    if not is_logged_in() or session['user_type'] != 'coiffeur':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    new_item = Menu(
        coiffeur_id=session['user_id'],
        name=data['name'],
        price=data['price'],
        description=data.get('description')
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({'message': 'Item added', 'id': new_item.id}), 201

@app.route('/api/coiffeur/menu/<int:id>', methods=['DELETE'])
def api_delete_menu(id):
    if not is_logged_in() or session['user_type'] != 'coiffeur': return jsonify({'error': 'Unauthorized'}), 403
    item = Menu.query.get(id)
    if item and item.coiffeur_id == session['user_id']:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    return jsonify({'error': 'Not found'}), 404

# --- ADDED: Update coiffeur location ---
@app.route('/api/coiffeur/location', methods=['POST'])
def api_update_location():
    if not is_logged_in() or session['user_type'] != 'coiffeur':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    coiffeur = Coiffeur.query.get(session['user_id'])
    coiffeur.latitude = data.get('latitude')
    coiffeur.longitude = data.get('longitude')
    coiffeur.location_updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Location updated'}), 200

# --- ADDED: Get all coiffeur locations for map ---
@app.route('/api/coiffeurs/locations', methods=['GET'])
def api_get_all_locations():
    active_coiffeurs = db.session.query(User, Coiffeur).join(Coiffeur).filter(
        Coiffeur.latitude.is_not(None), Coiffeur.status == 'active'
    ).all()
    
    locations = []
    for user, coif in active_coiffeurs:
        locations.append({
            'id': user.id, 
            'name': user.name,
            'lat': coif.latitude, 
            'lng': coif.longitude,
            'address': coif.address,
            'category': coif.category
        })
    return jsonify(locations)

@app.route('/api/coiffeurs/nearby', methods=['GET'])
def api_nearby():
    try:
        lat = float(request.args.get('lat', 48.86))
        lon = float(request.args.get('lon', 2.33))
        
        active_coiffeurs = db.session.query(User, Coiffeur).join(Coiffeur).filter(
            Coiffeur.latitude.is_not(None), Coiffeur.status == 'active'
        ).all()
        
        nearby = []
        for user, coif in active_coiffeurs:
            dist = haversine(lat, lon, coif.latitude, coif.longitude)
            if dist < 50:
                nearby.append({
                    'id': user.id, 'name': user.name, 
                    'lat': coif.latitude, 'lng': coif.longitude,
                    'dist': round(dist, 1)
                })
        return jsonify(nearby)
    except:
        return jsonify([])

# --- Subscription / Social API ---

@app.route('/api/coiffeur/<int:id>/subscribe', methods=['POST', 'DELETE'])
def api_subscribe(id):
    if not is_logged_in() or session['user_type'] != 'client':
        return jsonify({'error': 'Unauthorized'}), 403
    
    sub = Subscription.query.filter_by(client_id=session['user_id'], coiffeur_id=id).first()
    
    if request.method == 'POST':
        if not sub:
            db.session.add(Subscription(client_id=session['user_id'], coiffeur_id=id))
    elif request.method == 'DELETE':
        if sub:
            db.session.delete(sub)
            
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@app.route('/api/publications/with_images', methods=['POST'])
def api_create_pub():
    if not is_logged_in() or session['user_type'] != 'coiffeur':
        return jsonify({'error': 'Unauthorized'}), 403
    
    text = request.form.get('text', '')
    images = []
    
    for file in request.files.getlist('pub_images'):
        if file and allowed_file(file.filename):
            fname = secure_filename(file.filename)
            uniq = f"pub_{session['user_id']}_{int(datetime.now().timestamp())}_{fname}"
            fpath = os.path.join(app.config['UPLOAD_FOLDER'], uniq)
            file.save(fpath)
            images.append(f'/static/uploads/{uniq}')
            
    pub = Publication(author_id=session['user_id'], text=text, images=json.dumps(images))
    db.session.add(pub)
    db.session.commit()
    return jsonify({'message': 'Published', 'id': pub.id}), 201

# --- ADDED: Profile Image Upload ---
@app.route('/api/profile/upload_avatar', methods=['POST'])
def api_upload_avatar():
    if not is_logged_in() or session['user_type'] != 'coiffeur':
        return jsonify({'error': 'Unauthorized'}), 403

    if 'avatar_file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['avatar_file']
    if file and allowed_file(file.filename):
        fname = secure_filename(file.filename)
        uniq = f"avatar_{session['user_id']}_{int(datetime.now().timestamp())}_{fname}"
        fpath = os.path.join(app.config['UPLOAD_FOLDER'], uniq)
        file.save(fpath)
        
        # Update user/coiffeur record
        coiffeur = Coiffeur.query.get(session['user_id'])
        img_url = f'/static/uploads/{uniq}'
        coiffeur.profile_image = img_url
        db.session.commit()
        
        return jsonify({'message': 'Avatar updated', 'image_url': img_url}), 200
    
    return jsonify({'error': 'Invalid file'}), 400

# --- Catch-All for React Frontend ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """
    Serves the React frontend.
    Assumes React's 'index.html' is in the 'static' folder (or wherever build output goes).
    """
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # Return the main entry point for all other routes to let React Router handle them
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return "React Build not found. Please place 'index.html' in the 'static' folder.", 404

if __name__ == '__main__':
    app.run(debug=True)