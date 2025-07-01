from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import pymssql
import os
from dotenv import load_dotenv
import jwt
import datetime
from functools import wraps

load_dotenv()

user_bp = Blueprint('user', __name__)

# Azure SQL setup
server = os.getenv('AZURE_SQL_SERVER')
database = os.getenv('AZURE_SQL_DATABASE')
username = os.getenv('AZURE_SQL_USERNAME')
password = os.getenv('AZURE_SQL_PASSWORD')

def get_db_connection():
    """Get a fresh database connection"""
    try:
        conn = pymssql.connect(
            server=server,
            user=username,
            password=password,
            database=database,
            timeout=30,
            login_timeout=10,
            as_dict=False
        )
        return conn
    except Exception as e:
        raise RuntimeError(f"Database connection failed: {e}\nCheck if the database '{database}' exists and the user has access.")

# Initialize database and create tables
def init_database():
    """Initialize database tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
        CREATE TABLE users (
            id INT IDENTITY(1,1) PRIMARY KEY,
            username NVARCHAR(255) UNIQUE NOT NULL,
            password NVARCHAR(255) NOT NULL
        )
        """)
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
        CREATE TABLE sessions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            token NVARCHAR(MAX) NOT NULL,
            username NVARCHAR(255) NOT NULL,
            exp DATETIME2 NOT NULL
        )
        """)
        conn.commit()
    except Exception as e:
        raise RuntimeError(f"Table creation failed: {e}\nCheck if the user has permission to create tables in the database.")
    finally:
        conn.close()

# Initialize the database on module load
init_database()

JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key')
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_SECONDS = 86400  # 1 day

def generate_jwt(username):
    exp = datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    payload = {
        'user': username,
        'exp': exp
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    # Store session in DB
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO sessions (token, username, exp) VALUES (%s, %s, %s)",
            (token, username, exp)
        )
        conn.commit()
    finally:
        conn.close()
    return token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = data['user']
            # Check if session exists and not expired
            cursor.execute(
                "SELECT exp FROM sessions WHERE token=%s AND username=%s", (token, current_user)
            )
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Session not found!'}), 401
            exp = row[0]
            if exp < datetime.datetime.utcnow():
                cursor.execute("DELETE FROM sessions WHERE token=%s AND username=%s", (token, current_user))
                conn.commit()
                return jsonify({'error': 'Session expired!'}), 401
        except jwt.ExpiredSignatureError:
            cursor.execute("DELETE FROM sessions WHERE token=%s", (token,))
            conn.commit()
            return jsonify({'error': 'Token has expired!'}), 401
        except Exception:
            return jsonify({'error': 'Token is invalid!'}), 401
        finally:
            conn.close()
        return f(current_user, *args, **kwargs)
    return decorated

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        if cursor.fetchone():
            return jsonify({'error': 'User already exists'}), 409
        hashed_pw = generate_password_hash(password)
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_pw))
        conn.commit()
        return jsonify({'message': 'User registered successfully'})
    finally:
        conn.close()

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT password FROM users WHERE username=%s", (username,))
        row = cursor.fetchone()
        if not row or not check_password_hash(row[0], password):
            return jsonify({'error': 'Invalid username or password'}), 401
        token = generate_jwt(username)
        return jsonify({'token': token})
    finally:
        conn.close()

@user_bp.route('/protected', methods=['GET'])
@token_required
def protected_route(current_user):
    return jsonify({'message': f'Welcome {current_user}!'} )
