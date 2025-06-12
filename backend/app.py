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

# Tworzenie aplikacji Flask
app = Flask(__name__)
CORS(app)

# Konfiguracja
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Zmień to w produkcji
app.config['SQLALCHEMY_DATABASE_URI'] = 'mssql+pyodbc://sa:YourStrong!Passw0rd@localhost/PartyMembersDB?driver=ODBC+Driver+17+for+SQL+Server'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Upewnij się, że katalog przesyłania plików istnieje
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Inicjalizacja SQLAlchemy
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Modele
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
    status = db.Column(db.String(20), nullable=False, default='Oczekujący')
    join_date = db.Column(db.Date, nullable=False, default=datetime.date.today)
    party_role = db.Column(db.String(50), nullable=False, default='Członek')
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

# Dekorator uwierzytelniania
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Pobierz token z nagłówka Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'message': 'Brakuje tokenu uwierzytelniania',
                'error': 'Nieautoryzowany'
            }), 401
        
        try:
            # Dekoduj token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['id']).first()
            
            if not current_user:
                return jsonify({
                    'message': 'Nieprawidłowy token uwierzytelniania',
                    'error': 'Nieautoryzowany'
                }), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({
                'message': 'Token uwierzytelniania wygasł',
                'error': 'Nieautoryzowany'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'message': 'Nieprawidłowy token uwierzytelniania',
                'error': 'Nieautoryzowany'
            }), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Obsługa błędów
@app.errorhandler(Exception)
def handle_error(e):
    # Loguj błąd
    app.logger.error(f"Błąd: {str(e)}")
    app.logger.error(traceback.format_exc())
    
    # Zwróć odpowiednią odpowiedź
    if isinstance(e, jwt.ExpiredSignatureError):
        return jsonify({'message': 'Token uwierzytelniania wygasł', 'error': 'Nieautoryzowany'}), 401
    elif isinstance(e, jwt.InvalidTokenError):
        return jsonify({'message': 'Nieprawidłowy token uwierzytelniania', 'error': 'Nieautoryzowany'}), 401
    
    return jsonify({'message': 'Wystąpił błąd', 'error': str(e)}), 500

# Trasy
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Walidacja wymaganych pól
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Brakuje wymaganych pól'}), 400
        
        # Sprawdź czy użytkownik już istnieje
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Użytkownik z tym adresem email już istnieje'}), 409
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Nazwa użytkownika jest już zajęta'}), 409
        
        # Utwórz nowego użytkownika
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password,
            role='user'  # Domyślna rola
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Wygeneruj token
        token = jwt.encode({
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'role': new_user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Użytkownik zarejestrowany pomyślnie',
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Rejestracja nie powiodła się', 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Walidacja wymaganych pól
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Brakuje adresu email lub hasła'}), 400
        
        # Znajdź użytkownika
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'message': 'Nieprawidłowy adres email lub hasło'}), 401
        
        # Wygeneruj token
        token = jwt.encode({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Logowanie pomyślne',
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Logowanie nie powiodło się', 'error': str(e)}), 500

# Trasy dla członków
@app.route('/api/members', methods=['GET'])
@token_required
def get_members(current_user):
    try:
        # Pobierz parametry zapytania dla paginacji i wyszukiwania
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '', type=str)
        status_filter = request.args.get('status', '', type=str)
        
        # Zbuduj zapytanie
        query = Member.query
        
        # Zastosuj filtr wyszukiwania
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Member.first_name.ilike(search_term)) |
                (Member.last_name.ilike(search_term)) |
                (Member.email.ilike(search_term))
            )
        
        # Zastosuj filtr statusu
        if status_filter:
            query = query.filter(Member.status == status_filter)
        
        # Pobierz całkowitą liczbę
        total = query.count()
        
        # Paginacja
        members = query.order_by(Member.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        # Przygotuj odpowiedź
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
        return jsonify({'message': 'Nie udało się pobrać członków', 'error': str(e)}), 500

@app.route('/api/members/<int:id>', methods=['GET'])
@token_required
def get_member(current_user, id):
    try:
        member = Member.query.get(id)
        
        if not member:
            return jsonify({'message': 'Członek nie został znaleziony'}), 404
        
        # Formatuj dane członka
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
        return jsonify({'message': 'Nie udało się pobrać członka', 'error': str(e)}), 500

@app.route('/api/members', methods=['POST'])
@token_required
def create_member(current_user):
    try:
        data = request.get_json()
        
        # Walidacja wymaganych pól
        if not data or not data.get('first_name') or not data.get('last_name') or not data.get('email'):
            return jsonify({'message': 'Brakuje wymaganych pól'}), 400
        
        # Sprawdź czy email już istnieje
        if Member.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Członek z tym adresem email już istnieje'}), 409
        
        # Parsuj join_date
        join_date = data.get('join_date')
        if join_date:
            try:
                join_date = datetime.datetime.strptime(join_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Nieprawidłowy format daty dla join_date (użyj RRRR-MM-DD)'}), 400
        else:
            join_date = datetime.date.today()
        
        # Utwórz nowego członka
        new_member = Member(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            postal_code=data.get('postal_code'),
            status=data.get('status', 'Oczekujący'),
            join_date=join_date,
            party_role=data.get('party_role', 'Członek'),
            notes=data.get('notes')
        )
        
        db.session.add(new_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Członek utworzony pomyślnie',
            'member_id': new_member.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Nie udało się utworzyć członka', 'error': str(e)}), 500

@app.route('/api/members/<int:id>', methods=['PUT'])
@token_required
def update_member(current_user, id):
    try:
        member = Member.query.get(id)
        
        if not member:
            return jsonify({'message': 'Członek nie został znaleziony'}), 404
        
        data = request.get_json()
        
        # Sprawdź czy email już istnieje dla innego członka
        if 'email' in data and data['email'] != member.email:
            existing_member = Member.query.filter_by(email=data['email']).first()
            if existing_member and existing_member.id != id:
                return jsonify({'message': 'Członek z tym adresem email już istnieje'}), 409
        
        # Aktualizuj pola
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
        
        # Parsuj join_date
        if 'join_date' in data:
            try:
                member.join_date = datetime.datetime.strptime(data['join_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Nieprawidłowy format daty dla join_date (użyj RRRR-MM-DD)'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Członek zaktualizowany pomyślnie'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Nie udało się zaktualizować członka', 'error': str(e)}), 500

@app.route('/api/members/<int:id>', methods=['DELETE'])
@token_required
def delete_member(current_user, id):
    try:
        member = Member.query.get(id)
        
        if not member:
            return jsonify({'message': 'Członek nie został znaleziony'}), 404
        
        # Usuń członka (dokumenty zostaną usunięte kaskadowo)
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Członek usunięty pomyślnie'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Nie udało się usunąć członka', 'error': str(e)}), 500

# Trasy dla dokumentów
@app.route('/api/members/<int:member_id>/documents', methods=['POST'])
@token_required
def upload_document(current_user, member_id):
    try:
        # Sprawdź czy członek istnieje
        member = Member.query.get(member_id)
        if not member:
            return jsonify({'message': 'Członek nie został znaleziony'}), 404
        
        # Sprawdź czy plik jest w żądaniu
        if 'file' not in request.files:
            return jsonify({'message': 'Nie podano pliku'}), 400
        
        file = request.files['file']
        
        # Sprawdź czy nazwa pliku jest pusta
        if file.filename == '':
            return jsonify({'message': 'Nie wybrano pliku'}), 400
        
        document_type = request.form.get('document_type', 'Inne')
        
        # Wygeneruj unikalną nazwę pliku
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Zapisz plik
        file.save(file_path)
        
        # Pobierz rozmiar pliku
        file_size = os.path.getsize(file_path)
        
        # Utwórz rekord dokumentu
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
            'message': 'Dokument przesłany pomyślnie',
            'document_id': new_document.id,
            'filename': filename,
            'document_type': document_type,
            'file_size': file_size
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Nie udało się przesłać dokumentu', 'error': str(e)}), 500

@app.route('/api/members/<int:member_id>/documents', methods=['GET'])
@token_required
def get_member_documents(current_user, member_id):
    try:
        # Sprawdź czy członek istnieje
        member = Member.query.get(member_id)
        if not member:
            return jsonify({'message': 'Członek nie został znaleziony'}), 404
        
        # Pobierz dokumenty
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
        return jsonify({'message': 'Nie udało się pobrać dokumentów', 'error': str(e)}), 500

@app.route('/api/documents/<int:document_id>/download', methods=['GET'])
@token_required
def download_document(current_user, document_id):
    try:
        # Pobierz dokument
        document = Document.query.get(document_id)
        
        if not document:
            return jsonify({'message': 'Dokument nie został znaleziony'}), 404
        
        # Pobierz typ MIME na podstawie rozszerzenia pliku
        mime_type, _ = mimetypes.guess_type(document.filename)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Zwróć plik
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.filename,
            mimetype=mime_type
        )
        
    except Exception as e:
        return jsonify({'message': 'Nie udało się pobrać dokumentu', 'error': str(e)}), 500

@app.route('/api/documents/<int:document_id>', methods=['DELETE'])
@token_required
def delete_document(current_user, document_id):
    try:
        # Pobierz dokument
        document = Document.query.get(document_id)
        
        if not document:
            return jsonify({'message': 'Dokument nie został znaleziony'}), 404
        
        # Usuń plik z dysku
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Usuń rekord z bazy danych
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({
            'message': 'Dokument usunięty pomyślnie'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Nie udało się usunąć dokumentu', 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        # Utwórz tabele bazy danych jeśli nie istnieją
        db.create_all()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
