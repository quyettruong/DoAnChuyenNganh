from flask import Flask, request, jsonify
from flask_cors import CORS
from summarize_cv import summarize_resume_multilang, tfidf_en, tfidf_vi

app = Flask(__name__)
CORS(app)

@app.route("/summarize", methods=["POST"])
def summarize_api():
    data = request.get_json()
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    summary, lang = summarize_resume_multilang(text, tfidf_en, tfidf_vi)

    return jsonify({
        "summary": summary,
        "language": lang
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
