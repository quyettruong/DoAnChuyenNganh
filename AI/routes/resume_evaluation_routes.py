from flask import Blueprint, jsonify, request

from services.resume_evaluation_service import evaluate_resume_against_job

resume_evaluation_bp = Blueprint("resume_evaluation", __name__)


@resume_evaluation_bp.route("/evaluate-resume", methods=["GET", "POST", "OPTIONS"])
def evaluate_resume_api():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if request.method == "GET":
        return jsonify({
            "error": "Method not allowed. Use POST instead.",
            "example": {
                "method": "POST",
                "body": {
                    "cvText": "Candidate CV text",
                    "jobTitle": "Frontend Developer",
                    "skills": ["Vue.js", "NestJS"],
                },
                "headers": {"Content-Type": "application/json"},
            },
        }), 405

    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid JSON format"}), 400

        cv_text = (data.get("cvText") or "").strip()
        if not cv_text:
            return jsonify({"error": "No CV text provided"}), 400

        return jsonify({
            "statusCode": 200,
            "message": "Resume evaluation generated successfully",
            "data": evaluate_resume_against_job(data),
        }), 200

    except Exception as exc:
        print(f"Error in evaluate_resume_api: {str(exc)}")
        return jsonify({
            "statusCode": 500,
            "message": "Internal server error",
            "error": str(exc),
        }), 500
