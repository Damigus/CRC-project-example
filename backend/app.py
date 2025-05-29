from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import jwt
import uuid
import datetime
import os
from functools import wraps
import traceback
import mimetypes

# Create Flask application
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'mssql+pyodbc://sa:YourStrong!Passw0rd@localhost/PartyMembersDB?driver=ODBC+Driver+17+for+SQL+Server'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure the upload directory exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Initialize SQLAlchemy
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    join_date = db.Column(db.Date, nullable=False, default=datetime.date.today)
    party_role = db.Column(db.String(50), nullable=False, default='Member')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    documents = db.relationship('Document', backref='member', lazy=True, cascade="all, delete-orphan")

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'message': 'Authentication token is missing',
                'error': 'Unauthorized'
            }), 401
        
        try:
            # Decode token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['id']).first()
            
            if not current_user:
                return jsonify({
                    'message': 'Invalid authentication token',
                    'error': 'Unauthorized'
                }), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({
                'message': 'Authentication token has expired',
                'error': 'Unauthorized'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'message': 'Invalid authentication token',
                'error': 'Unauthorized'
            }), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Error handler
@app.errorhandler(Exception)
def handle_error(e):
    # Log the error
    app.logger.error(f"Error: {str(e)}")
    app.logger.error(traceback.format_exc())
    
    # Return appropriate response
    if isinstance(e, jwt.ExpiredSignatureError):
        return jsonify({'message': 'Authentication token has expired', 'error': 'Unauthorized'}), 401
    elif isinstance(e, jwt.InvalidTokenError):
        return jsonify({'message': 'Invalid authentication token', 'error': 'Unauthorized'}), 401
    
    return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'User with this email already exists'}), 409
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already taken'}), 409
        
        # Create new user
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password,
            role='user'  # Default role
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate token
        token = jwt.encode({
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'role': new_user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Missing email or password'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Generate token
        token = jwt.encode({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

# Member routes
@app.route('/api/members', methods=['GET'])
@token_required
def get_members(current_user):
    try:
        # Get query parameters for pagination and search
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '', type=str)
        status_filter = request.args.get('status', '', type=str)
        
        # Build query
        query = Member.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Member.first_name.ilike(search_term)) |
                (Member.last_name.ilike(search_term)) |
                (Member.email.ilike(search_term))
            )
        
        # Apply status filter
        if status_filter:
            query = query.filter(Member.status == status_filter)
        
        # Get total count
        total = query.count()
        
        # Paginate
        members = query.order_by(Member.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        # Prepare response
        result = []
        for member in members.items:
            result.append({
                'id': member.id,
                'first_name': member.first_name,
                'last_name': member.last_name,
                'email': member.email,
                'phone': member.phone,
                'status': member.status,
                'join_date': member.join_date.isoformat() if member.join_date else None,
                'party_role': member.party_role
            })
        
        return jsonify({
            'members': result,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to retrieve members', 'error': str(e)}), 500

@app.route('/api/members/<int:id>', methods=['GET'])
@token_required
def get_member(current_user, id):
    try:
        member = Member.query.get(id)
        
        if not member:
            return jsonify({'message': 'Member not found'}), 404
        
        # Format member data
        member_data = {
            'id': member.id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'email': member.email,
            'phone': member.phone,
            'address': member.address,
            'city': member.city,
            'postal_code': member.postal_code,
            'status': member.status,
            'join_date': member.join_date.isoformat() if member.join_date else None,
            'party_role': member.party_role,
            'notes': member.notes,
            'created_at': member.created_at.isoformat(),
            'updated_at': member.updated_at.isoformat()
        }
        
        return jsonify({
            'member': member_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to retrieve member', 'error': str(e)}), 500

@app.route('/api/members', methods=['POST'])
@token_required
def create_member(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('first_name') or not data.get('last_name') or not data.get('email'):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if email already exists
        if Member.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Member with this email already exists'}), 409
        
        # Parse join_date
        join_date = data.get('join_date')
        if join_date:
            try:
                join_date = datetime.datetime.strptime(join_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Invalid date format for join_date (use YYYY-MM-DD)'}), 400
        else:
            join_date = datetime.date.today()
        
        # Create new member
        new_member = Member(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            postal_code=data.get('postal_code'),
            status=data.get('status', 'Pending'),
            join_date=join_date,
            party_role=data.get('party_role', 'Member'),
            notes=data.get('notes')
        )
        
        db.session.add(new_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Member created successfully',
            'member_id': new_member.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create member', 'error': str(e)}), 500

@app.route('/api/members/<int:id>', methods=['PUT'])
@token_required
def update_member(current_user, id):
    try:
        member = Member.query.get(id)
        
        if not member:
            return jsonify({'message': 'Member not found'}), 404
        
        data = request.get_json()
        
        # Check if email already exists for another member
        if 'email' in data and data['email'] != member.email:
            existing_member = Member.query.filter_by(email=data['email']).first()
            if existing_member and existing_member.id != id:
                return jsonify({'message': 'Member with this email already exists'}), 409
        
        # Update fields
        if 'first_name' in data:
            member.first_name = data['first_name']
        if 'last_name' in data:
            member.last_name = data['last_name']
        if 'email' in data:
            member.email = data['email']
        if 'phone' in data:
            member.phone = data['phone']
        if 'address' in data:
            member.address = data['address']
        if 'city' in data:
            member.city = data['city']
        if 'postal_code' in data:
            member.postal_code = data['postal_code']
        if 'status' in data:
            member.status = data['status']
        if 'party_role' in data:
            member.party_role = data['party_role']
        if 'notes' in data:
            member.notes = data['notes']
        
        # Parse join_date
        if 'join_date' in data:
            try:
                member.join_date = datetime.datetime.strptime(data['join_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Invalid date format for join_date (use YYYY-MM-DD)'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Member updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update member', 'error': str(e)}), 500

@app.route('/api/members/<int:id>', methods=['DELETE'])
@token_required
def delete_member(current_user, id):
    try:
        member = Member.query.get(id)
        
        if not member:
            return jsonify({'message': 'Member not found'}), 404
        
        # Delete member (documents will be cascade deleted)
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Member deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete member', 'error': str(e)}), 500

# Document routes
@app.route('/api/members/<int:member_id>/documents', methods=['POST'])
@token_required
def upload_document(current_user, member_id):
    try:
        # Check if member exists
        member = Member.query.get(member_id)
        if not member:
            return jsonify({'message': 'Member not found'}), 404
        
        # Check if file is in the request
        if 'file' not in request.files:
            return jsonify({'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if filename is empty
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        document_type = request.form.get('document_type', 'Other')
        
        # Generate a unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create document record
        new_document = Document(
            member_id=member_id,
            document_type=document_type,
            filename=filename,
            file_path=file_path,
            file_size=file_size
        )
        
        db.session.add(new_document)
        db.session.commit()
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document_id': new_document.id,
            'filename': filename,
            'document_type': document_type,
            'file_size': file_size
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to upload document', 'error': str(e)}), 500

@app.route('/api/members/<int:member_id>/documents', methods=['GET'])
@token_required
def get_member_documents(current_user, member_id):
    try:
        # Check if member exists
        member = Member.query.get(member_id)
        if not member:
            return jsonify({'message': 'Member not found'}), 404
        
        # Get documents
        documents = Document.query.filter_by(member_id=member_id).order_by(Document.upload_date.desc()).all()
        
        result = []
        for doc in documents:
            result.append({
                'id': doc.id,
                'document_type': doc.document_type,
                'filename': doc.filename,
                'file_size': doc.file_size,
                'upload_date': doc.upload_date.isoformat()
            })
        
        return jsonify({
            'documents': result
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to retrieve documents', 'error': str(e)}), 500

@app.route('/api/documents/<int:document_id>/download', methods=['GET'])
@token_required
def download_document(current_user, document_id):
    try:
        # Get document
        document = Document.query.get(document_id)
        
        if not document:
            return jsonify({'message': 'Document not found'}), 404
        
        # Get MIME type based on file extension
        mime_type, _ = mimetypes.guess_type(document.filename)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Return the file
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.filename,
            mimetype=mime_type
        )
        
    except Exception as e:
        return jsonify({'message': 'Failed to download document', 'error': str(e)}), 500

@app.route('/api/documents/<int:document_id>', methods=['DELETE'])
@token_required
def delete_document(current_user, document_id):
    try:
        # Get document
        document = Document.query.get(document_id)
        
        if not document:
            return jsonify({'message': 'Document not found'}), 404
        
        # Delete file from disk
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete database record
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({
            'message': 'Document deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete document', 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        # Create database tables if they don't exist
        db.create_all()
    
    app.run(debug=True, host='0.0.0.0', port=5000)