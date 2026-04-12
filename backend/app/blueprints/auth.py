from flask import Blueprint, request, jsonify
from app.extensions import supabase

auth_bp = Blueprint('auth', __name__)
@auth_bp.route('/api/auth/register/teacher', methods=['POST'])
def register_teacher():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name')

    if not email or not password or not display_name:
        return jsonify({'error': 'Please provide all information'}), 400
    try: 
        auth_response = supabase.auth.sign_up({
            'email': email,
            'password': password
        })

        if not auth_response.user:
            return jsonify({'error': 'Failed to create user, please try one more time or later'}), 400
        user_id = auth_response.user.id

        try:
            supabase.table('users').insert({
                'id': user_id,
                'email': email,
                'display_name': display_name,
                'role': 'teacher'
            }).execute()
        except Exception as db_error:
            return jsonify({'error': 'Failed to save user information, please try again'}), 500
        
        return jsonify({'message': 'Teacher registered successfully'}), 201
    except Exception as auth_error:
        return jsonify({'error': str(auth_error)}), 400

    
