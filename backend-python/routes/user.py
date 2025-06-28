from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import pyodbc
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
driver = os.getenv('AZURE_SQL_DRIVER', '{ODBC Driver 17 for SQL Server}')

conn_str = (
    f'DRIVER={driver};'
    f'SERVER={server};'
    f'DATABASE={database};'
    f'UID={username};'
    f'PWD={password};'
    'Encrypt=yes;'
    'TrustServerCertificate=no;'
    'Connection Timeout=30;'
)
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
except pyodbc.InterfaceError as e:
    raise RuntimeError(f"Database connection failed: {e}\nCheck if the database 'canarabank' exists and the user has access.")

# Ensure tables exist (run only if connection is successful)
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
    cursor.execute(
        "INSERT INTO sessions (token, username, exp) VALUES (?, ?, ?)",
        token, username, exp
    )
    conn.commit()
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
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = data['user']
            # Check if session exists and not expired
            cursor.execute(
                "SELECT exp FROM sessions WHERE token=? AND username=?", (token, current_user)
            )
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Session not found!'}), 401
            exp = row[0]
            if exp < datetime.datetime.utcnow():
                cursor.execute("DELETE FROM sessions WHERE token=? AND username=?", (token, current_user))
                conn.commit()
                return jsonify({'error': 'Session expired!'}), 401
        except jwt.ExpiredSignatureError:
            cursor.execute("DELETE FROM sessions WHERE token=?", (token,))
            conn.commit()
            return jsonify({'error': 'Token has expired!'}), 401
        except Exception:
            return jsonify({'error': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    cursor.execute("SELECT * FROM users WHERE username=?", username)
    if cursor.fetchone():
        return jsonify({'error': 'User already exists'}), 409
    hashed_pw = generate_password_hash(password)
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_pw))
    conn.commit()
    return jsonify({'message': 'User registered successfully'})

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    cursor.execute("SELECT password FROM users WHERE username=?", (username,))
    row = cursor.fetchone()
    if not row or not check_password_hash(row[0], password):
        return jsonify({'error': 'Invalid username or password'}), 401
    token = generate_jwt(username)
    return jsonify({'token': token})

@user_bp.route('/protected', methods=['GET'])
@token_required
def protected_route(current_user):
    return jsonify({'message': f'Welcome {current_user}!'} )
