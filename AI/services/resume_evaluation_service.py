from summarize_cv import detect_lang, get_tfidf_by_lang, tfidf_en, tfidf_vi
from services.common import (
    SKILL_ALIASES,
    STOPWORDS,
    clean_text,
    compact_text,
    strip_html,
)


def extract_keywords(text, limit=18):
    cleaned = clean_text(text or "")
    tokens = [token for token in cleaned.split() if len(token) >= 3 and token not in STOPWORDS]
    counts = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1
    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    return [item[0] for item in ranked[:limit]]


def skill_is_matched(skill, cv_clean, cv_compact, cv_tokens):
    skill_clean = clean_text(skill or "")
    skill_compact = compact_text(skill or "")
    if not skill_clean:
        return False

    aliases = SKILL_ALIASES.get(skill_clean, [])
    candidates = [skill_clean, skill_compact, *aliases]
    for candidate in candidates:
        candidate_clean = clean_text(candidate)
        candidate_compact = compact_text(candidate)
        if candidate_clean and candidate_clean in cv_clean:
            return True
        if candidate_compact and candidate_compact in cv_compact:
            return True

    important_tokens = [token for token in skill_clean.split() if len(token) >= 2]
    if important_tokens and all(token in cv_tokens for token in important_tokens):
        return True

    return False


def cosine_similarity_for_cv_job(cv_text, job_text):
    try:
        lang = detect_lang(cv_text)
        tfidf_vec = get_tfidf_by_lang(lang, tfidf_en, tfidf_vi)
        matrix = tfidf_vec.transform([clean_text(cv_text), clean_text(job_text)])
        similarity = (matrix[0] * matrix[1].T).toarray()[0][0]
        return max(0, min(100, round(similarity * 220)))
    except Exception as exc:
        print(f"Error in cosine_similarity_for_cv_job: {str(exc)}")
        return 0


def recommendation_from_score(score):
    if score >= 80:
        return "APPROVED"
    if score >= 55:
        return "REVIEWING"
    return "REJECTED"


def evaluate_resume_against_job(payload):
    cv_text = (payload.get("cvText") or "").strip()
    job_title = (payload.get("jobTitle") or "").strip()
    company_name = (payload.get("companyName") or "").strip()
    job_description = payload.get("jobDescription") or ""
    level = (payload.get("level") or "").strip()
    location = (payload.get("location") or "").strip()
    skills = payload.get("skills") or []
    skills = [str(skill).strip() for skill in skills if str(skill).strip()]

    cv_clean = clean_text(cv_text)
    cv_compact = compact_text(cv_text)
    cv_tokens = set(cv_clean.split())

    matched_skills = []
    missing_skills = []
    for skill in skills:
        if skill_is_matched(skill, cv_clean, cv_compact, cv_tokens):
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    job_text = " ".join([job_title, company_name, strip_html(job_description), level, location, " ".join(skills)])
    keywords = extract_keywords(job_text)
    matched_keywords = [keyword for keyword in keywords if keyword in cv_tokens or keyword in cv_compact]

    skill_score = round(len(matched_skills) / len(skills) * 100) if skills else 0
    keyword_score = round(len(matched_keywords) / len(keywords) * 100) if keywords else 50
    semantic_score = cosine_similarity_for_cv_job(cv_text, job_text)

    level_clean = clean_text(level)
    level_score = 60
    if level_clean:
        level_tokens = set(level_clean.split())
        level_score = 100 if level_tokens.intersection(cv_tokens) else 55

    if skills:
        total_score = round(
            skill_score * 0.55
            + semantic_score * 0.25
            + keyword_score * 0.15
            + level_score * 0.05
        )
    else:
        total_score = round(semantic_score * 0.45 + keyword_score * 0.45 + level_score * 0.10)

    total_score = max(0, min(100, total_score))
    recommendation = recommendation_from_score(total_score)

    strengths = []
    weaknesses = []

    if skills:
        strengths.append(f"Khớp {len(matched_skills)}/{len(skills)} kỹ năng yêu cầu của công việc.")
    if matched_skills:
        strengths.append("Kỹ năng nổi bật: " + ", ".join(matched_skills[:6]) + ".")
    if semantic_score >= 45:
        strengths.append("Nội dung CV có độ tương đồng tốt với mô tả công việc.")
    if matched_keywords:
        strengths.append("CV có nhắc tới các từ khóa liên quan: " + ", ".join(matched_keywords[:6]) + ".")

    if missing_skills:
        weaknesses.append("Chưa thấy rõ trong CV: " + ", ".join(missing_skills[:6]) + ".")
    if semantic_score < 25:
        weaknesses.append("Mô tả kinh nghiệm trong CV còn chưa sát với yêu cầu công việc.")
    if not matched_keywords:
        weaknesses.append("CV chưa thể hiện nhiều từ khóa chính từ mô tả công việc.")

    if not strengths:
        strengths.append("CV có thông tin cơ bản để HR tiếp tục xem xét thủ công.")
    if not weaknesses:
        weaknesses.append("Chưa phát hiện thiếu sót lớn dựa trên dữ liệu hiện có.")

    if recommendation == "APPROVED":
        conclusion = "Ứng viên có mức độ phù hợp cao, HR nên ưu tiên xem xét hoặc mời phỏng vấn."
    elif recommendation == "REVIEWING":
        conclusion = "Ứng viên phù hợp ở mức cần xem xét thêm, HR nên đọc kỹ kinh nghiệm và dự án liên quan."
    else:
        conclusion = "Ứng viên chưa thể hiện đủ yêu cầu chính của công việc, HR nên cân nhắc trước khi đi tiếp."

    evaluation = (
        f"AI đánh giá CV đạt {total_score}/100 cho vị trí {job_title or 'đang tuyển'}. "
        f"{conclusion}"
    )

    return {
        "aiMatchScore": total_score,
        "aiRecommendation": recommendation,
        "aiMatchedSkills": matched_skills,
        "aiMissingSkills": missing_skills,
        "aiStrengths": strengths,
        "aiWeaknesses": weaknesses,
        "aiEvaluation": evaluation,
    }
