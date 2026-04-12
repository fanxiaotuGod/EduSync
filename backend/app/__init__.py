#这个文件要做两件事情分别是加载config配置并且注册所有的Blueprints#

from flask import Flask
from flask_cors import CORS
from app.config import Config #import config class, flask can read the config of Supabase#
from app.blueprints.health import health_bp
from app.blueprints.auth import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config) #import the config class to flask app#

    CORS(app)

    app.register_blueprint(health_bp) 
    app.register_blueprint(auth_bp)
    # register the health_bp into the falsk, then the /api/health will be activated#

    print('Flask app created successfully')

    return app

    #CORS -> Cross-Origin Resource Sharing, 允许前端访问后端接口#