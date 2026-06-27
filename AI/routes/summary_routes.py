from flask import Blueprint, jsonify, request

from services.summary_service import summarize_resume_text

summary_bp = Blueprint("summary", __name__)


@summary_bp.route("/summarize", methods=["GET", "POST", "OPTIONS"])
def summarize_api():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if request.method == "GET":
        return jsonify({
            "error": "Method not allowed. Use POST instead.",
            "example": {
                "method": "POST",
                "body": {"text": "Your CV text here"},
                "headers": {"Content-Type": "application/json"},
            },
        }), 405

    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid JSON format"}), 400

        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "No text provided"}), 400

        return jsonify({
            "statusCode": 200,
            "message": "Summary generated successfully",
            "data": summarize_resume_text(text),
        }), 200

    except Exception as exc:
        print(f"Error in summarize_api: {str(exc)}")
        return jsonify({
            "statusCode": 500,
            "message": "Internal server error",
            "error": str(exc),
        }), 500
