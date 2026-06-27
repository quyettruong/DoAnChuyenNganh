from flask import Flask, jsonify
from flask_cors import CORS

from routes.cv_generator_routes import cv_generator_bp
from routes.resume_evaluation_routes import resume_evaluation_bp
from routes.summary_routes import summary_bp
from routes.support_chat_routes import support_chat_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.route("/", methods=["GET"])
    def health():
        return jsonify({
            "status": "AI Server is running",
            "services": [
                "summarize",
                "evaluate-resume",
                "generate-cv",
                "support-chat",
            ],
        }), 200

    app.register_blueprint(summary_bp)
    app.register_blueprint(resume_evaluation_bp)
    app.register_blueprint(cv_generator_bp)
    app.register_blueprint(support_chat_bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)


