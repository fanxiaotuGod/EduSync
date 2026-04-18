from flask import Blueprint, request, jsonify, g
from app.middleware.auth import require_auth
from app.extensions import supabase

users_bp = Blueprint('users', __name__)
@users_bp.route('/api/users', methods=['GET'])
@require_auth #这个装饰器的作用是让这个路由在访问的时候先调用require_auth这个函数来验证token的有效性，如果token无效或者过期会返回401错误，如果token有效则继续执行get_user函数#
def get_user():
    user_id = g.current_user.id #获取用户ID#
    
    try:
        user_data = supabase.table('users').select('*').eq('id', user_id).execute()

        if not user_data.data:
            return jsonify({'error': 'User not found'}), 404
        user = user_data.data[0]

        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'display_name': user['display_name'],
            'created_at' : user['created_at']
            }), 200
    except Exception as e:
        return jsonify({'error': 'something went wrong'}), 500
    
