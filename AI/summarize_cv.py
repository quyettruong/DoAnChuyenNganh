# 1) IMPORT THƯ VIỆN
import re
import numpy as np
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from langdetect import detect, LangDetectException
from joblib import load, dump

# 2) HÀM TIỀN XỬ LÝ VĂN BẢN

def clean_text(text: str) -> str:
    """
    Hạ chữ, bỏ ký tự đặc biệt, chuẩn hóa khoảng trắng.
    Dùng chung cho cả EN và VI.
    """
    text = text.lower()
    text = re.sub(
        r"[^a-z0-9áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêềếểễệ"
        r"íìỉĩịóòỏõọôốồổỗộơớờởỡợ"
        r"úùủũụưứừửữựýỳỷỹỵđ\s]",
        " ",
        text,
    )
    text = re.sub(r"\s+", " ", text).strip()
    return text


# 3) NHẬN DIỆN NGÔN NGỮ (EN / VI)

def detect_lang(text: str) -> str:
    try:
        lang = detect(text)
    except LangDetectException:
        lang = "unknown"
    return lang   # thường trả về 'en', 'vi', ...


# 4) TÁCH CÂU CHO TIẾNG ANH

def split_sentences_en(text: str):
    """
    Tách câu tiếng Anh đơn giản bằng regex, không cần NLTK.
    """
    text = re.sub(r"\s+", " ", text).strip()
    raw_sents = re.split(r"(?<=[\.?!])\s+", text)
    sents = [s.strip() for s in raw_sents if len(s.strip()) > 0]
    return sents


# 5) TÁCH CÂU CHO TIẾNG VIỆT

def split_sentences_vi(text: str):
    """
    Bản đơn giản dùng regex.
    Nếu muốn dùng underthesea thì thay vào.
    """
    text = re.sub(r"\s+", " ", text).strip()
    raw_sents = re.split(r"(?<=[\.?!])\s+", text)
    sents = [s.strip() for s in raw_sents if len(s.strip()) > 0]
    return sents
    # Nếu dùng underthesea thì:
    # return vi_sent_tokenize(text)


# 6) HÀM TÁCH CÂU CHUNG CHO CẢ HAI NGÔN NGỮ

def split_sentences_multilang(text: str):
    lang = detect_lang(text)
    if lang == "en":
        sents = split_sentences_en(text)
    elif lang == "vi":
        sents = split_sentences_vi(text)
    else:
        # fallback cho ngôn ngữ khác
        sents = split_sentences_en(text)
    return sents, lang


# 7) LOAD DỮ LIỆU KAGGLE

def load_resume_data(path="final_merged_dataset2.csv", n_samples=300):
    df = pd.read_csv(path)
    # Tùy dataset, thường cột nội dung là 'Resume'
    df = df[["Resume"]]  # nếu có cột Category thì giữ thêm cũng được
    df = df.head(n_samples).copy()
    return df


# 8) PHÂN LOẠI NGÔN NGỮ CHO TỪNG CV VÀ TẠO CORPUS

def build_corpus_by_lang(df: pd.DataFrame):
    resumes = df["Resume"].tolist()
    langs = [detect_lang(t) for t in resumes]

    corpus_en = []
    corpus_vi = []

    for text, lang in zip(resumes, langs):
        c = clean_text(text)
        if lang == "en":
            corpus_en.append(c)
        elif lang == "vi":
            corpus_vi.append(c)
        else:
            corpus_en.append(c)

    return corpus_en, corpus_vi


# 9) TRAIN HAI MÔ HÌNH TF-IDF (EN, VI)

def train_tfidf_models(corpus_en, corpus_vi):
    tfidf_en = TfidfVectorizer(max_features=5000, stop_words="english")
    tfidf_vi = TfidfVectorizer(max_features=5000)  # Không dùng stop_words tiếng Anh

    # Train EN
    if len(corpus_en) > 0:
        tfidf_en.fit(corpus_en)
        print("Vocab EN:", len(tfidf_en.vocabulary_))
    else:
        print("Không có CV tiếng Anh để train.")

    # Train VI — chỉ train nếu có dữ liệu
    if len(corpus_vi) > 0:
        tfidf_vi.fit(corpus_vi)
        print("Vocab VI:", len(tfidf_vi.vocabulary_))
    else:
        print("Không có CV tiếng Việt để train -> bỏ qua TF-IDF tiếng Việt.")
        tfidf_vi = None   # hoặc giữ nguyên nhưng không gọi vocabulary_

    print("Số CV EN:", len(corpus_en))
    print("Số CV VI:", len(corpus_vi))

    return tfidf_en, tfidf_vi


# 10) CHỌN TF-IDF TƯƠNG ỨNG THEO NGÔN NGỮ

def get_tfidf_by_lang(lang, tfidf_en, tfidf_vi):
    if lang == "vi" and tfidf_vi is not None:
        return tfidf_vi
    return tfidf_en


# 11) XÂY DỰNG MA TRẬN TƯƠNG ĐỒNG CÂU

def build_similarity_matrix(sent_cleaned, tfidf_vectorizer):
    if len(sent_cleaned) == 0:
        return np.array([[]])

    tfidf_matrix = tfidf_vectorizer.transform(sent_cleaned)
    sim_matrix = (tfidf_matrix * tfidf_matrix.T).toarray()
    np.fill_diagonal(sim_matrix, 0)
    return sim_matrix


# 12) THUẬT TOÁN PAGERANK TÍNH ĐIỂM CHO CÂU

def pagerank(sim_matrix, d=0.85, max_iter=100, tol=1e-6):
    n = sim_matrix.shape[0]
    if n == 0:
        return []

    row_sums = sim_matrix.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    M = sim_matrix / row_sums

    scores = np.ones(n) / n

    for _ in range(max_iter):
        new_scores = (1 - d) / n + d * M.T.dot(scores)
        if np.linalg.norm(new_scores - scores, ord=1) < tol:
            break
        scores = new_scores

    return scores


# 13) HÀM TÓM TẮT CV HỖ TRỢ CẢ EN VÀ VI

def summarize_resume_multilang(raw_text: str,
                               tfidf_en,
                               tfidf_vi,
                               ratio: float = 0.25,
                               max_sent: int = 5):
    sents, lang = split_sentences_multilang(raw_text)
    if len(sents) == 0:
        return "", lang

    cleaned = [clean_text(s) for s in sents]
    tfidf_vec = get_tfidf_by_lang(lang, tfidf_en, tfidf_vi)

    sim_matrix = build_similarity_matrix(cleaned, tfidf_vec)
    scores = pagerank(sim_matrix)

    k = max(1, min(max_sent, int(len(sents) * ratio)))
    ranked_idx = np.argsort(scores)[::-1][:k]
    ranked_idx = sorted(ranked_idx)

    summary = " ".join([sents[i] for i in ranked_idx])
    return summary, lang


# 14) ĐÁNH GIÁ THỬ TRÊN MỘT SỐ CV

def evaluate_on_sample(df: pd.DataFrame,
                       tfidf_en,
                       tfidf_vi,
                       n_examples: int = 5):
    stats = []

    for i, row in df.head(n_examples).iterrows():
        text = row["Resume"]
        summary, lang = summarize_resume_multilang(text, tfidf_en, tfidf_vi)

        len_orig = len(text.split())
        len_sum = len(summary.split())
        compression = len_sum / len_orig if len_orig > 0 else 0

        stats.append({
            "len_orig": len_orig,
            "len_sum": len_sum,
            "compression": compression,
            "lang": lang
        })

        print("=" * 40)
        print(f"CV #{i} – language: {lang}")
        print("Độ dài gốc:", len_orig,
              " | Độ dài tóm tắt:", len_sum,
              " | Tỉ lệ nén:", round(compression, 3))

        print("\nTÓM TẮT:")
        print(summary)

    df_stats = pd.DataFrame(stats)
    print("\nTrung bình tỉ lệ nén:", df_stats["compression"].mean())
    print(df_stats.groupby("lang")["compression"].mean())
    return df_stats


# ================== GLOBAL INIT: load data & train TF-IDF ==================

print("Đang load dữ liệu CV để train TF-IDF (summarize_cv.py)...")
df_global = load_resume_data(path="final_merged_dataset2.csv", n_samples=300)
print("Số CV dùng để train:", len(df_global))

corpus_en_global, corpus_vi_global = build_corpus_by_lang(df_global)
tfidf_en, tfidf_vi = train_tfidf_models(corpus_en_global, corpus_vi_global)

print("Khởi tạo TF-IDF xong, sẵn sàng để dùng trong app.py.")


# ================== MAIN: chỉ dùng khi chạy file này trực tiếp ==================

if __name__ == "__main__":
    df_stats = evaluate_on_sample(df_global, tfidf_en, tfidf_vi, n_examples=5)
