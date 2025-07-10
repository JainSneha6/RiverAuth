from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import pymssql
import os
from dotenv import load_dotenv
import jwt
import datetime
from functools import wraps
import uuid

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
        # Check if users table exists and has the email column
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
        BEGIN
            CREATE TABLE users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(255) UNIQUE NOT NULL,
                email NVARCHAR(255) UNIQUE NOT NULL,
                password NVARCHAR(255) NOT NULL,
                first_name NVARCHAR(255),
                last_name NVARCHAR(255),
                phone NVARCHAR(20),
                aadhaar NVARCHAR(12),
                pan NVARCHAR(10),
                address NVARCHAR(500),
                city NVARCHAR(100),
                state NVARCHAR(100),
                pincode NVARCHAR(10),
                occupation NVARCHAR(100),
                income DECIMAL(15,2),
                account_type NVARCHAR(50),
                signup_step INT DEFAULT 1,
                is_complete BIT DEFAULT 0,
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            )
        END
        ELSE
        BEGIN
            -- Add email column if it doesn't exist
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email')
            BEGIN
                ALTER TABLE users ADD email NVARCHAR(255)
            END
            
            -- Add other missing columns if they don't exist
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'first_name')
            BEGIN
                ALTER TABLE users ADD first_name NVARCHAR(255)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_name')
            BEGIN
                ALTER TABLE users ADD last_name NVARCHAR(255)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'phone')
            BEGIN
                ALTER TABLE users ADD phone NVARCHAR(20)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'aadhaar')
            BEGIN
                ALTER TABLE users ADD aadhaar NVARCHAR(12)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'pan')
            BEGIN
                ALTER TABLE users ADD pan NVARCHAR(10)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'address')
            BEGIN
                ALTER TABLE users ADD address NVARCHAR(500)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'city')
            BEGIN
                ALTER TABLE users ADD city NVARCHAR(100)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'state')
            BEGIN
                ALTER TABLE users ADD state NVARCHAR(100)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'pincode')
            BEGIN
                ALTER TABLE users ADD pincode NVARCHAR(10)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'occupation')
            BEGIN
                ALTER TABLE users ADD occupation NVARCHAR(100)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'income')
            BEGIN
                ALTER TABLE users ADD income DECIMAL(15,2)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'account_type')
            BEGIN
                ALTER TABLE users ADD account_type NVARCHAR(50)
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'signup_step')
            BEGIN
                ALTER TABLE users ADD signup_step INT DEFAULT 1
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_complete')
            BEGIN
                ALTER TABLE users ADD is_complete BIT DEFAULT 0
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at')
            BEGIN
                ALTER TABLE users ADD created_at DATETIME2 DEFAULT GETDATE()
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at')
            BEGIN
                ALTER TABLE users ADD updated_at DATETIME2 DEFAULT GETDATE()
            END
        END
        """)
        
        # Sessions table for session management
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
        CREATE TABLE sessions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            session_id NVARCHAR(255) UNIQUE NOT NULL,
            user_id INT NOT NULL,
            username NVARCHAR(255) NOT NULL,
            token NVARCHAR(MAX),
            created_at DATETIME2 DEFAULT GETDATE(),
            expires_at DATETIME2 NOT NULL,
            is_active BIT DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        
        # Behavioral data table for storing user interactions
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_behavioral_data' AND xtype='U')
        CREATE TABLE user_behavioral_data (
            id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT,
            session_id NVARCHAR(255),
            event_type NVARCHAR(100),
            event_data NVARCHAR(MAX),
            timestamp DATETIME2 DEFAULT GETDATE(),
            client_ip NVARCHAR(50),
            user_agent NVARCHAR(500),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        
        # Security questions table for storing user security questions and answers
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_security_questions' AND xtype='U')
        CREATE TABLE user_security_questions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT NOT NULL,
            question NVARCHAR(500) NOT NULL,
            answer_hash NVARCHAR(255) NOT NULL,
            question_index INT NOT NULL,
            created_at DATETIME2 DEFAULT GETDATE(),
            FOREIGN KEY (user_id) REFERENCES users(id)
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

def generate_session(user_id, username):
    """Generate a new session for the user"""
    session_id = str(uuid.uuid4())
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    
    # Generate JWT token
    payload = {
        'user_id': user_id,
        'username': username,
        'session_id': session_id,
        'exp': expires_at
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    # Store session in database
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO sessions (session_id, user_id, username, token, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (session_id, user_id, username, token, expires_at)
        )
        conn.commit()
    finally:
        conn.close()
    
    return {
        'session_id': session_id,
        'token': token,
        'expires_at': expires_at.isoformat()
    }

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
            user_id = data['user_id']
            username = data['username']
            session_id = data['session_id']
            
            # Check if session exists and is active
            cursor.execute(
                "SELECT expires_at, is_active FROM sessions WHERE session_id=%s AND user_id=%s AND is_active=1", 
                (session_id, user_id)
            )
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Session not found or inactive!'}), 401
            
            expires_at = row[0]
            if expires_at < datetime.datetime.utcnow():
                # Deactivate expired session
                cursor.execute("UPDATE sessions SET is_active=0 WHERE session_id=%s", (session_id,))
                conn.commit()
                return jsonify({'error': 'Session expired!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except Exception:
            return jsonify({'error': 'Token is invalid!'}), 401
        finally:
            conn.close()
        return f(user_id, username, *args, **kwargs)
    return decorated

# Step 1: Initial signup with basic info (Signup2 page)
@user_bp.route('/signup/step1', methods=['POST'])
def signup_step1():
    """Handle Signup2 form data"""
    try:
        data = request.json
        print(f"Received signup step1 data: {data}")  # Debug logging
        
        required_fields = ['firstName', 'lastName', 'email', 'phone', 'aadhaar', 'pan', 'password', 'confirmPassword']
        
        # Validate required fields
        for field in required_fields:
            if not data.get(field):
                print(f"Missing field: {field}")  # Debug logging
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate password match
        if data['password'] != data['confirmPassword']:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Generate username from email (can be customized)
        username = data['email'].split('@')[0]
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email=%s OR username=%s", (data['email'], username))
            if cursor.fetchone():
                return jsonify({'error': 'User with this email already exists'}), 409
            
            # Hash password
            hashed_pw = generate_password_hash(data['password'])
            
            # Insert user with step 1 data
            print(f"Inserting user: {username}, {data['email']}")  # Debug logging
            cursor.execute("""
                INSERT INTO users (username, email, password, first_name, last_name, phone, aadhaar, pan, signup_step)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (username, data['email'], hashed_pw, data['firstName'], data['lastName'], 
                  data['phone'], data['aadhaar'], data['pan'], 1))
            
            conn.commit()
            
            # Get user ID
            cursor.execute("SELECT id FROM users WHERE email=%s", (data['email'],))
            user_id = cursor.fetchone()[0]
            print(f"User created with ID: {user_id}")  # Debug logging
            
            # Generate session
            session_data = generate_session(user_id, username)
            
            return jsonify({
                'message': 'Step 1 completed successfully',
                'user_id': user_id,
                'username': username,
                'next_step': 2,
                'session': session_data
            }), 201
            
        except Exception as e:
            print(f"Database error in signup_step1: {e}")  # Debug logging
            conn.rollback()
            return jsonify({'error': f'Registration failed: {str(e)}'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        print(f"General error in signup_step1: {e}")  # Debug logging
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500
        conn.close()

# Step 2: Complete signup with address and account info (Signup3 page)
@user_bp.route('/signup/step2', methods=['POST'])
@token_required
def signup_step2(user_id, username):
    """Handle Signup3 form data"""
    data = request.json
    required_fields = ['address', 'city', 'state', 'pincode', 'occupation', 'income', 'accountType', 'agreeTerms']
    
    # Validate required fields
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    if not data.get('agreeTerms'):
        return jsonify({'error': 'You must agree to terms and conditions'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Update user with step 2 data
        cursor.execute("""
            UPDATE users SET 
                address=%s, city=%s, state=%s, pincode=%s, occupation=%s, 
                income=%s, account_type=%s, signup_step=%s, is_complete=%s, updated_at=GETDATE()
            WHERE id=%s
        """, (data['address'], data['city'], data['state'], data['pincode'], data['occupation'],
              float(data['income']), data['accountType'], 2, 1, user_id))
        
        conn.commit()
        
        return jsonify({
            'message': 'Registration completed successfully!',
            'user_id': user_id,
            'username': username,
            'registration_complete': True
        }), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Step 2 completion failed: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/login', methods=['POST'])
def login():
    """Handle login from LoginPage"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Find user by username or email
        cursor.execute("""
            SELECT id, username, email, password, first_name, last_name, is_complete, signup_step 
            FROM users WHERE username=%s OR email=%s
        """, (username, username))
        
        row = cursor.fetchone()
        if not row or not check_password_hash(row[3], password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        user_id, db_username, email, _, first_name, last_name, is_complete, signup_step = row
        
        # Generate new session
        session_data = generate_session(user_id, db_username)
        
        response_data = {
            'message': 'Login successful',
            'user': {
                'id': user_id,
                'username': db_username,
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'is_complete': bool(is_complete),
                'signup_step': signup_step
            },
            'session': session_data
        }
        
        # If signup is not complete, indicate next step
        if not is_complete:
            response_data['requires_completion'] = True
            response_data['next_step'] = signup_step + 1
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/logout', methods=['POST'])
@token_required
def logout(user_id, username):
    """Handle user logout"""
    # Get session ID from token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Deactivate session
        cursor.execute("UPDATE sessions SET is_active=0 WHERE token=%s AND user_id=%s", (token, user_id))
        conn.commit()
        
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(user_id, username):
    """Get user profile information"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT username, email, first_name, last_name, phone, address, city, state, 
                   pincode, occupation, income, account_type, is_complete, signup_step, created_at
            FROM users WHERE id=%s
        """, (user_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            'id': user_id,
            'username': row[0],
            'email': row[1],
            'first_name': row[2],
            'last_name': row[3],
            'phone': row[4],
            'address': row[5],
            'city': row[6],
            'state': row[7],
            'pincode': row[8],
            'occupation': row[9],
            'income': float(row[10]) if row[10] else None,
            'account_type': row[11],
            'is_complete': bool(row[12]),
            'signup_step': row[13],
            'created_at': row[14].isoformat() if row[14] else None
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/behavioral-data', methods=['POST'])
@token_required  
def store_behavioral_data(user_id, username):
    """Store behavioral data from frontend"""
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO user_behavioral_data (user_id, session_id, event_type, event_data, client_ip, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, data.get('session_id'), data.get('event_type'), 
              str(data.get('event_data', {})), request.remote_addr, request.user_agent.string))
        
        conn.commit()
        return jsonify({'message': 'Behavioral data stored successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to store behavioral data: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/security-questions', methods=['POST'])
@token_required  
def save_security_questions(user_id, username):
    """Save user security questions and answers"""
    data = request.json
    questions_data = data.get('questions', [])
    
    if not questions_data or len(questions_data) != 5:
        return jsonify({'error': 'Exactly 5 security questions with answers are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Delete existing security questions for this user
        cursor.execute("DELETE FROM user_security_questions WHERE user_id = %s", (user_id,))
        
        # Insert new security questions
        for index, qa in enumerate(questions_data):
            question = qa.get('question')
            answer = qa.get('answer', '').strip()
            
            if not question or not answer:
                return jsonify({'error': f'Question {index + 1} is missing question or answer'}), 400
            
            # Hash the answer for security (case-insensitive)
            answer_hash = generate_password_hash(answer.lower())
            
            cursor.execute("""
                INSERT INTO user_security_questions (user_id, question, answer_hash, question_index)
                VALUES (%s, %s, %s, %s)
            """, (user_id, question, answer_hash, index))
        
        conn.commit()
        return jsonify({'message': 'Security questions saved successfully'}), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to save security questions: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/security-questions', methods=['GET'])
@token_required  
def get_security_questions(user_id, username):
    """Get user security questions (without answers)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT question, question_index 
            FROM user_security_questions 
            WHERE user_id = %s 
            ORDER BY question_index
        """, (user_id,))
        
        rows = cursor.fetchall()
        questions = [{'question': row[0], 'index': row[1]} for row in rows]
        
        return jsonify({'questions': questions}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get security questions: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/verify-security-answers', methods=['POST'])
@token_required  
def verify_security_answers(user_id, username):
    """Verify security question answers"""
    data = request.json
    answers = data.get('answers', [])
    
    if not answers:
        return jsonify({'error': 'Answers are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT question_index, answer_hash 
            FROM user_security_questions 
            WHERE user_id = %s 
            ORDER BY question_index
        """, (user_id,))
        
        stored_answers = cursor.fetchall()
        
        if len(answers) != len(stored_answers):
            return jsonify({'error': 'Number of answers does not match'}), 400
        
        correct_count = 0
        for i, (stored_index, stored_hash) in enumerate(stored_answers):
            if i < len(answers) and check_password_hash(stored_hash, answers[i].lower().strip()):
                correct_count += 1
        
        # Require at least 3 out of 5 correct answers
        is_verified = correct_count >= 3
        
        return jsonify({
            'verified': is_verified,
            'correct_answers': correct_count,
            'total_questions': len(stored_answers)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to verify answers: {str(e)}'}), 500
    finally:
        conn.close()

@user_bp.route('/protected', methods=['GET'])
@token_required
def protected_route(current_user):
    return jsonify({'message': f'Welcome {current_user}!'} )
