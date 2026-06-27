from flask import Blueprint, jsonify, request

from services.cv_generator_service import generate_cv_for_job

cv_generator_bp = Blueprint("cv_generator", __name__)


@cv_generator_bp.route("/generate-cv", methods=["GET", "POST", "OPTIONS"])
def generate_cv_api():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if request.method == "GET":
        return jsonify({
            "error": "Method not allowed. Use POST instead.",
            "example": {
                "method": "POST",
                "body": {
                    "jobTitle": "Frontend Developer",
                    "skills": ["Vue.js", "REST API"],
                    "userPrompt": "Em có 2 project sinh viên...",
                },
                "headers": {"Content-Type": "application/json"},
            },
        }), 405

    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid JSON format"}), 400

        return jsonify({
            "statusCode": 200,
            "message": "CV draft generated successfully",
            "data": generate_cv_for_job(data),
        }), 200

    except Exception as exc:
        print(f"Error in generate_cv_api: {str(exc)}")
        return jsonify({
            "statusCode": 500,
            "message": "Internal server error",
            "error": str(exc),
        }), 500
