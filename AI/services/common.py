import re
import unicodedata

from summarize_cv import clean_text


STOPWORDS = {
    "and", "or", "the", "a", "an", "to", "of", "in", "for", "with", "on",
    "is", "are", "be", "as", "at", "by", "from", "job", "work", "team",
    "va", "hoac", "la", "cua", "cho", "voi", "trong", "tai", "den", "tu",
    "ung", "vien", "cong", "viec", "du", "an", "nhom", "kinh", "nghiem",
    "yeu", "cau", "mo", "ta", "lam", "phat", "trien", "he", "thong",
}

SKILL_ALIASES = {
    "javascript": ["js", "java script"],
    "typescript": ["ts", "type script"],
    "vue js": ["vuejs", "vue"],
    "react js": ["reactjs", "react"],
    "node js": ["nodejs", "node"],
    "next js": ["nextjs", "next"],
    "nest js": ["nestjs", "nest"],
    "html css": ["html", "css"],
    "c sharp": ["c#", "csharp"],
    "dot net": [".net", "asp net", "asp.net"],
}

COMMON_SKILLS = [
    "React", "Vue.js", "Angular", "TypeScript", "JavaScript", "HTML/CSS",
    "Node.js", "NestJS", "Java", "Spring Boot", "Python", "Django",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "REST API", "Git",
    "Testing", "Manual Testing", "Automation Testing", "Figma", "Docker",
    "Magento", "Project Management", "Agile", "Scrum",
]


def compact_text(text):
    return re.sub(r"\s+", "", clean_text(text or ""))


def strip_vietnamese_accents(text):
    normalized = unicodedata.normalize("NFD", text or "")
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return without_marks.replace("đ", "d").replace("Đ", "D")


def contains_any(text, keywords):
    return any(keyword in text for keyword in keywords)


def strip_html(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", text).strip()


def unique_keep_order(values, limit=None):
    seen = set()
    result = []
    for value in values:
        item = str(value or "").strip()
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
        if limit and len(result) >= limit:
            break
    return result
