from functools import wraps
from flask import request, jsonify, g
from app.extensions import supabase

def require_auth(f):
    @wraps(f) #这个装饰器的作用是让被装饰的函数在执行前先执行decorated_function这个函数#
    def decorated_function(*args, **kwargs):
        
        auth_header = request.headers.get('Authorization')
        #在这个函数里我们首先从请求头里获取Authorization字段，这个字段应该包含了前端发送过来的token#

        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid token format'}), 401
        
        token = auth_header.split(' ')[1]
        #按照空格切开拿取第二个字段也就是token字符串#

        try:
            user = supabase.auth.get_user(token)
            #这个函数会验证token的有效性，如果token无效或者过期会抛出异常 去supabase里面拿取token对应的信息#
            if not user or not user.user:
                return jsonify({'error': 'Invalid token'}), 401
            
            g.current_user = user.user
            #如果token有效，我们把用户信息存储在request对象的user属性中，这样后续的视图函数就可以通过request.user来访问当前用户的信息#

        except Exception as e:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        return f(*args, **kwargs)
    #最后我们调用被装饰的函数f，并把原来的参数传递给它，这样就完成了对视图函数的包装，实现了在访问受保护的路由时需要先验证token的功能#
    return decorated_function
#这个相当于包装的好的新函数让在调用需要登录才能查看的数据的时候先调用这个函数#