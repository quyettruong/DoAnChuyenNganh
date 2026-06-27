from flask import Blueprint, jsonify, request

from services.support_chat_service import build_support_reply

support_chat_bp = Blueprint("support_chat", __name__)


@support_chat_bp.route("/support-chat", methods=["GET", "POST", "OPTIONS"])
def support_chat_api():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if request.method == "GET":
        return jsonify({
            "error": "Method not allowed. Use POST instead.",
            "example": {
                "method": "POST",
                "body": {
                    "message": "Tôi muốn tạo CV cho job này",
                    "path": "/job/frontend-developer",
                    "authenticated": True,
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
            "message": "Support reply generated successfully",
            "data": build_support_reply(data),
        }), 200

    except Exception as exc:
        print(f"Error in support_chat_api: {str(exc)}")
        return jsonify({
            "statusCode": 500,
            "message": "Internal server error",
            "error": str(exc),
        }), 500
