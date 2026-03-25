from flask import Flask

def create_app():
    app = Flask(__name__)

    print("🔥 create_app 已执行")

    @app.route("/")
    def home():
        return "HOME OK"

    @app.route("/test")
    def test():
        return "TEST OK"

    return app