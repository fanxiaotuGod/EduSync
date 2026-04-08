from flask import Blueprint, jsonify
# 从flask 导入两个工具 一个用来创建api分组，另一个用来把python字典文件转化成json格式返回给前端#

health_bp = Blueprint('health', __name__)
#创建一个叫做health的Blueprint并且存在-.bp的变量里面 后面要注册#

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200
#如果有人用get方式访问这个地址就执行这个函数#
#定义了health——check函数 return {'status': 'ok'} the 200 means successful#