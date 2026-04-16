from flask import Blueprint, request, jsonify
from app.extensions import supabase

auth_bp = Blueprint('auth', __name__)


def _register_user(role):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name')
#这里是后端正在接受前端发来的注册信息，因为后端要先拿到信息才能注册所以要用到.get用法#

    if not email or not password or not display_name:
        return jsonify({'error': 'Please provide all information'}), 400
    try:
        auth_response = supabase.auth.sign_up({
            'email': email,
            'password': password
        })
        #把邮箱和密码传给supabase的auth工具 让它帮我们注册#

        if not auth_response.user:
            return jsonify({'error': 'Failed to create account, please try again or later'}), 400
        
        if not auth_response.session:
            return jsonify({'error': 'Email already registered, please use another email'}), 409
        
        if role not in ['teacher', 'student']:
            return jsonify({'error': 'Invalid role'}), 400
        
        user_id = auth_response.user.id

        try:
            supabase.table('users').insert({
                'id': user_id,
                'email': email,
                'display_name': display_name,
                'role': role
            }).execute()
        except Exception as ab_error:
            supabase.auth.admin.delete_user(user_id)
            return jsonify({'error': 'Failed to save your information, try again'}), 500
        
        return jsonify({
            'message': f'{role.capitalize()} registered successfully'
        }), 201

    except Exception as auth_error:
        return jsonify({'error': str(auth_error)}), 400


@auth_bp.route('/api/auth/register/teacher', methods=['POST'])
def register_teacher():
    return _register_user('teacher')

@auth_bp.route('/api/auth/register/student', methods=['POST'])
def register_student():
    return _register_user('student')


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    email = data.get('email')
    password = data.get('password')
    #从数据里面取出邮箱和密码#

    if not email or not password:
        return jsonify({'error': 'Please provide both email and password'}), 400
    try:
        auth_response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        #把邮箱和密码传给supabase的auth工具 让它帮我们验证，跟注册不一样，注册时sign_up 登陆时用sign_in_with_password#
        if not auth_response.user:
            return jsonify({'error':'Invalid email or password'}), 401
        user_id = auth_response.user.id
        token = auth_response.session.access_token
        #从登陆结果中取出用户的唯一ID 和JWT token 用于验证身份#

        user_data = supabase.table('users').select('*').eq('id', user_id).execute()
        #去user表里面取出所有的字段让id等于user_id的用户数据并且执行查询#
        if not user_data.data:
            return jsonify({'error': 'User data not found'}), 404
        
        user = user_data.data[0]
        #取出查询结果的第一条数据 因为select返回的是一个列表 我们只需要第一条就好#

        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'email':email,
                'display_name': user['display_name'],
                'role':user['role']

            }
        }), 200
    except Exception as e:
        return jsonify({'error': 'Invalid email or password'}), 401
     #登录成功的话返回token和用户信息给前端，登录失败的话统一返回401错误#   
        


