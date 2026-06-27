from summarize_cv import summarize_resume_multilang, tfidf_en, tfidf_vi


def summarize_resume_text(text):
    summary, lang = summarize_resume_multilang(text, tfidf_en, tfidf_vi)
    return {
        "summary": summary,
        "language": lang,
    }
