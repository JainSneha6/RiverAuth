from flask import Flask
from flask_cors import CORS  # ✅ Add this import
from routes.user import user_bp  # Import the user blueprint
import os
app = Flask(__name__)

# ✅ Apply CORS properly
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Session-ID", "X-User-ID"]
}})
app.register_blueprint(user_bp)  # Register the user blueprint
@app.route('/', methods=['GET'])
def hello_world():
    return 'Hello World!'

if __name__ == '__main__':
    app.run(debug=True)
