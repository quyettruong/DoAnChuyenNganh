import re

from services.common import (
    COMMON_SKILLS,
    SKILL_ALIASES,
    STOPWORDS,
    clean_text,
    compact_text,
    strip_html,
    strip_vietnamese_accents,
    unique_keep_order,
)


ROLE_PROFILES = {
    "frontend": {
        "label": "Frontend",
        "signals": [
            "frontend", "front end", "react", "vue", "angular", "typescript",
            "javascript", "html", "css", "ui", "ux", "giao dien", "responsive",
        ],
        "summary": "tập trung xây dựng giao diện rõ ràng, responsive, dễ dùng và kết nối API ổn định",
        "experience": [
            "Phân tích giao diện và luồng người dùng từ yêu cầu công việc để chia nhỏ thành component/chức năng có thể triển khai.",
            "Xây dựng màn hình responsive, xử lý form, trạng thái tải/lỗi và kết nối API theo nghiệp vụ.",
            "Tối ưu trải nghiệm người dùng bằng cách rà lại bố cục, khoảng cách, trạng thái tương tác và khả năng hiển thị trên nhiều kích thước màn hình.",
        ],
        "project_title": "Giao diện tuyển dụng IT Career",
        "project": [
            "Thiết kế các màn hình danh sách việc làm, chi tiết job, tạo CV và theo dõi trạng thái ứng tuyển.",
            "Tổ chức component dùng lại, xử lý dữ liệu từ API và cải thiện trải nghiệm tìm kiếm/lọc việc.",
            "Kiểm tra responsive, trạng thái trống, trạng thái lỗi và các thao tác chính của người dùng.",
        ],
    },
    "backend": {
        "label": "Backend",
        "signals": [
            "backend", "back end", "java", "spring", "node", "nestjs", "api",
            "rest", "database", "sql", "mysql", "postgresql", "mongo", "server",
        ],
        "summary": "tập trung xây dựng API, xử lý nghiệp vụ, thiết kế dữ liệu và đảm bảo hệ thống hoạt động ổn định",
        "experience": [
            "Phân tích yêu cầu nghiệp vụ và thiết kế API, schema dữ liệu, validation và phân quyền phù hợp.",
            "Triển khai luồng xử lý chính, kết nối cơ sở dữ liệu và chuẩn hóa response/error để frontend dễ tích hợp.",
            "Kiểm thử API, rà soát trường hợp biên và tối ưu truy vấn cơ bản cho các màn hình có dữ liệu lớn.",
        ],
        "project_title": "REST API quản lý tuyển dụng",
        "project": [
            "Xây dựng API cho job, công ty, CV ứng tuyển, tài khoản và trạng thái hồ sơ.",
            "Thiết kế quan hệ dữ liệu, phân quyền theo vai trò và xử lý validation cho các thao tác tạo/sửa/xóa.",
            "Tài liệu hóa endpoint, kiểm thử luồng chính và phối hợp với frontend để hoàn thiện tích hợp.",
        ],
    },
    "tester": {
        "label": "Tester/QA",
        "signals": [
            "tester", "testing", "qa", "qc", "manual test", "automation",
            "kiem thu", "test case", "bug", "defect", "selenium",
        ],
        "summary": "tập trung kiểm thử nghiệp vụ, thiết kế test case, ghi nhận lỗi rõ ràng và đảm bảo chất lượng sản phẩm",
        "experience": [
            "Đọc yêu cầu nghiệp vụ, xác định luồng chính/luồng phụ và thiết kế test case theo mức độ ưu tiên.",
            "Thực hiện kiểm thử chức năng, UI, form nhập liệu, phân quyền và các trường hợp biên thường gặp.",
            "Ghi nhận lỗi rõ ràng với bước tái hiện, kết quả thực tế/kỳ vọng và phối hợp xác nhận sau khi sửa.",
        ],
        "project_title": "Bộ kiểm thử quy trình ứng tuyển",
        "project": [
            "Xây dựng test case cho luồng tìm việc, tạo CV, nộp CV, lưu job và xem trạng thái hồ sơ.",
            "Kiểm thử dữ liệu đầu vào, thông báo lỗi, trạng thái rỗng và quyền truy cập theo vai trò.",
            "Tổng hợp bug report, phân loại mức độ ảnh hưởng và xác nhận kết quả sau khi fix.",
        ],
    },
    "manager": {
        "label": "Project/Business",
        "signals": [
            "manager", "project manager", "product owner", "ba", "business analyst",
            "scrum", "agile", "quan ly", "phan tich nghiep vu", "bridge",
        ],
        "summary": "tập trung phân tích yêu cầu, điều phối công việc, giao tiếp với các bên liên quan và theo dõi tiến độ",
        "experience": [
            "Thu thập và làm rõ yêu cầu, chuyển đổi nhu cầu nghiệp vụ thành backlog/task có tiêu chí nghiệm thu rõ ràng.",
            "Theo dõi tiến độ, ưu tiên công việc, cập nhật trạng thái và hỗ trợ nhóm xử lý vướng mắc trong quá trình triển khai.",
            "Phối hợp với developer/tester để kiểm tra kết quả, phản hồi thay đổi và đảm bảo sản phẩm bám sát mục tiêu.",
        ],
        "project_title": "Kế hoạch quản lý dự án tuyển dụng",
        "project": [
            "Phân rã phạm vi hệ thống tuyển dụng thành các module: job, công ty, CV, tài khoản, bản đồ và AI hỗ trợ.",
            "Xây dựng backlog, mô tả user story, tiêu chí nghiệm thu và kế hoạch kiểm thử theo từng giai đoạn.",
            "Theo dõi tiến độ, tổng hợp rủi ro và đề xuất cải tiến trải nghiệm người dùng.",
        ],
    },
    "mobile": {
        "label": "Mobile",
        "signals": ["mobile", "android", "ios", "flutter", "react native", "app"],
        "summary": "tập trung xây dựng ứng dụng di động ổn định, dễ dùng và tích hợp API theo nghiệp vụ",
        "experience": [
            "Phân tích luồng người dùng trên mobile và triển khai màn hình phù hợp với nhiều kích thước thiết bị.",
            "Tích hợp API, xử lý trạng thái tải/lỗi, điều hướng và lưu trữ dữ liệu cần thiết ở phía client.",
            "Kiểm tra trải nghiệm thao tác, hiệu năng cơ bản và độ ổn định khi dữ liệu thay đổi.",
        ],
        "project_title": "Ứng dụng mobile hỗ trợ tìm việc",
        "project": [
            "Xây dựng màn hình danh sách job, chi tiết job, lưu việc và theo dõi hồ sơ ứng tuyển.",
            "Tích hợp API backend, xử lý trạng thái mạng và tối ưu trải nghiệm trên thiết bị di động.",
            "Kiểm thử luồng chính, điều hướng và giao diện trên nhiều kích thước màn hình.",
        ],
    },
    "general": {
        "label": "IT",
        "signals": [],
        "summary": "tập trung đọc hiểu yêu cầu, triển khai chức năng, phối hợp nhóm và cải thiện sản phẩm theo phản hồi",
        "experience": [
            "Phân tích yêu cầu công việc và chuyển thành các đầu việc rõ ràng để triển khai trong dự án.",
            "Ứng dụng kỹ năng kỹ thuật phù hợp để xây dựng chức năng, kiểm tra lỗi và hoàn thiện sản phẩm.",
            "Phối hợp với nhóm, tiếp nhận phản hồi và chủ động học thêm công nghệ cần thiết trong mô tả công việc.",
        ],
        "project_title": "Dự án mô phỏng nghiệp vụ IT",
        "project": [
            "Xây dựng các chức năng chính dựa trên mô tả công việc và nhu cầu người dùng.",
            "Tổ chức mã nguồn, xử lý dữ liệu, kiểm tra lỗi cơ bản và tài liệu hóa cách vận hành.",
            "Hoàn thiện giao diện/chức năng theo phản hồi và đánh giá lại mức độ phù hợp với yêu cầu ban đầu.",
        ],
    },
}


LEVEL_LABELS = {
    "intern": "thực tập",
    "fresher": "fresher",
    "junior": "junior",
    "middle": "middle",
    "senior": "senior",
    "manager": "quản lý",
}

DEFAULT_STARTER_SKILLS = {"react", "typescript", "html css"}
NON_SKILL_TAGS = {
    "frontend", "front end", "backend", "back end", "fullstack", "full stack",
    "developer", "dev", "it", "cntt", "remote", "onsite", "hybrid",
}
SKILL_DISPLAY_NAMES = {
    "react native": "React Native",
    "reactjs": "React",
    "react js": "React",
    "react": "React",
    "vuejs": "Vue.js",
    "vue js": "Vue.js",
    "vue": "Vue.js",
    "angular": "Angular",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "html css": "HTML/CSS",
    "nodejs": "Node.js",
    "node js": "Node.js",
    "nestjs": "NestJS",
    "nest js": "NestJS",
    "java": "Java",
    "spring boot": "Spring Boot",
    "python": "Python",
    "django": "Django",
    "sql": "SQL",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "mongo db": "MongoDB",
    "rest api": "REST API",
    "git": "Git",
    "testing": "Testing",
    "manual testing": "Manual Testing",
    "automation testing": "Automation Testing",
    "figma": "Figma",
    "docker": "Docker",
    "magento": "Magento",
    "project management": "Project Management",
    "agile": "Agile",
    "scrum": "Scrum",
}
GENERATED_TEXT_MARKERS = [
    "ban nhap can bo sung kinh nghiem that",
    "bo sung kinh nghiem du an that",
    "chuan bi ho so ung tuyen theo yeu cau vi tri",
    "ban nhap nay dat trong tam vao yeu cau cua job",
    "cv uu tien lam noi bat",
    "bam sat vi tri",
    "dinh huong ung tuyen vi tri",
    "ung vien dinh huong",
    "phan tich giao dien va luong nguoi dung",
    "xay dung man hinh responsive",
    "xay dung api cho job",
    "xay dung test case cho luong tim viec",
    "du an mo phong nghiep vu",
    "rest api quan ly tuyen dung",
    "giao dien tuyen dung it career",
]


def candidate_in_text(candidate, clean, compact):
    candidate_clean = clean_text(candidate)
    candidate_compact = compact_text(candidate)
    if not candidate_clean:
        return False

    if " " in candidate_clean:
        return candidate_clean in clean or candidate_compact in compact

    if len(candidate_clean) <= 4:
        return re.search(rf"(^|\s){re.escape(candidate_clean)}(\s|$)", clean) is not None

    return candidate_clean in clean or candidate_compact in compact


def infer_skills_from_text(text):
    clean = clean_text(text or "")
    compact = compact_text(text or "")
    detected = []
    for skill in COMMON_SKILLS:
        skill_clean = clean_text(skill)
        skill_compact = compact_text(skill)
        aliases = SKILL_ALIASES.get(skill_clean, [])
        candidates = [skill_clean, skill_compact, *aliases]
        if any(candidate_in_text(candidate, clean, compact) for candidate in candidates):
            detected.append(skill)
    return detected


def normalize_skill_name(skill):
    value = str(skill or "").strip()
    if not value:
        return ""
    cleaned = clean_text(value)
    compacted = compact_text(value)
    if cleaned in SKILL_DISPLAY_NAMES:
        return SKILL_DISPLAY_NAMES[cleaned]
    if compacted in SKILL_DISPLAY_NAMES:
        return SKILL_DISPLAY_NAMES[compacted]
    for common_skill in COMMON_SKILLS:
        if cleaned == clean_text(common_skill) or compacted == compact_text(common_skill):
            return common_skill
    if value.isupper() and len(value) > 2:
        return value.title().replace("Js", "JS").replace("Api", "API").replace("Sql", "SQL")
    return value


def normalize_skill_list(values):
    normalized = []
    for value in value_as_list(values):
        skill = normalize_skill_name(value)
        if not skill:
            continue
        if clean_text(skill) in NON_SKILL_TAGS:
            continue
        normalized.append(skill)
    return unique_keep_order(normalized, limit=20)


def value_as_list(value):
    if isinstance(value, list):
        return value
    return []


def text_from_items(items):
    chunks = []
    for item in value_as_list(items):
        if not isinstance(item, dict):
            continue
        chunks.extend([
            str(item.get("title") or ""),
            str(item.get("subtitle") or ""),
            str(item.get("time") or ""),
            str(item.get("description") or ""),
            str(item.get("technologies") or ""),
        ])
    return " ".join(chunks)


def item_has_content(item):
    if not isinstance(item, dict):
        return False
    return any(str(item.get(key) or "").strip() for key in ["title", "subtitle", "time", "description", "technologies"])


def non_empty_items(items):
    return [item for item in value_as_list(items) if item_has_content(item)]


def text_looks_generated(text):
    cleaned = clean_text(strip_vietnamese_accents(text or ""))
    if not cleaned:
        return False
    return any(marker in cleaned for marker in GENERATED_TEXT_MARKERS)


def item_looks_generated(item, job_title="", company_name=""):
    if not isinstance(item, dict):
        return False

    title_clean = clean_text(item.get("title") or "")
    subtitle_clean = clean_text(item.get("subtitle") or "")
    job_title_clean = clean_text(job_title or "")
    company_clean = clean_text(company_name or "")
    description = item.get("description") or ""

    if text_looks_generated(" ".join([
        str(item.get("title") or ""),
        str(item.get("subtitle") or ""),
        str(description),
        str(item.get("technologies") or ""),
    ])):
        return True

    if job_title_clean and company_clean and title_clean == job_title_clean and subtitle_clean == company_clean:
        return True

    return False


def trusted_items(items, job_title="", company_name=""):
    return [
        item
        for item in non_empty_items(items)
        if not item_looks_generated(item, job_title, company_name)
    ]


def build_trusted_context(current_cv, job_title, company_name, user_prompt):
    summary = current_cv.get("summary") or ""
    trusted_summary = "" if text_looks_generated(summary) else summary
    experiences = trusted_items(current_cv.get("experiences"), job_title, company_name)
    projects = trusted_items(current_cv.get("projects"), job_title, company_name)
    certificates = non_empty_items(current_cv.get("certificates"))
    current_skills = normalize_skill_list(current_cv.get("skills"))

    generated_content_exists = (
        text_looks_generated(summary)
        or len(experiences) < len(non_empty_items(current_cv.get("experiences")))
        or len(projects) < len(non_empty_items(current_cv.get("projects")))
    )
    trusted_text = " ".join([
        trusted_summary,
        text_from_items(experiences),
        text_from_items(projects),
        text_from_items(certificates),
    ])
    has_trusted_text = bool(clean_text(trusted_text))
    trust_skills = bool(user_prompt.strip()) or has_trusted_text or (
        bool(current_skills) and not looks_like_default_skills(current_skills) and not generated_content_exists
    )

    return {
        "summary": trusted_summary,
        "experiences": experiences,
        "projects": projects,
        "certificates": certificates,
        "text": trusted_text,
        "skills": current_skills if trust_skills else [],
        "trustSkills": trust_skills,
        "hasGeneratedContent": generated_content_exists,
    }


def split_description_lines(description):
    raw = str(description or "").replace("•", "\n").replace("·", "\n")
    return [line.strip(" -\t") for line in raw.split("\n") if line.strip(" -\t")]


def compact_line_key(line):
    return compact_text(line)[:80]


def merge_lines(existing_lines, new_lines, limit=5):
    result = []
    seen = set()
    for line in [*existing_lines, *new_lines]:
        clean_line = str(line or "").strip()
        if not clean_line:
            continue
        key = compact_line_key(clean_line)
        if key in seen:
            continue
        seen.add(key)
        result.append(clean_line)
        if len(result) >= limit:
            break
    return result


def detect_role_profile(job_title, job_description, skills, user_prompt):
    source = clean_text(" ".join([job_title, job_description, user_prompt, " ".join(skills)]))
    scores = {}
    for key, profile in ROLE_PROFILES.items():
        if key == "general":
            continue
        score = 0
        for signal in profile["signals"]:
            if clean_text(signal) in source:
                score += 1
        scores[key] = score

    best_key = max(scores, key=scores.get) if scores else "general"
    return ROLE_PROFILES[best_key] if scores.get(best_key, 0) > 0 else ROLE_PROFILES["general"]


def detect_level(level, job_title, user_prompt):
    source = clean_text(" ".join([level, job_title, user_prompt]))
    if "intern" in source or "thuc tap" in source:
        return "intern"
    if "fresher" in source or "moi ra truong" in source or "sinh vien" in source:
        return "fresher"
    if "junior" in source:
        return "junior"
    if "senior" in source or "lead" in source:
        return "senior"
    if "manager" in source or "quan ly" in source:
        return "manager"
    if "middle" in source or "mid" in source:
        return "middle"
    return "junior"


def extract_keywords(text, limit=10):
    cleaned = clean_text(text or "")
    tokens = [token for token in cleaned.split() if len(token) >= 3 and token not in STOPWORDS]
    counts = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1
    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    return [token for token, _ in ranked[:limit]]


def skill_matches(skill, skills):
    skill_clean = clean_text(skill or "")
    skill_compact = compact_text(skill or "")
    for item in skills:
        item_clean = clean_text(item or "")
        item_compact = compact_text(item or "")
        aliases = SKILL_ALIASES.get(skill_clean, [])
        if skill_clean == item_clean or skill_compact == item_compact:
            return True
        if any(clean_text(alias) == item_clean or compact_text(alias) == item_compact for alias in aliases):
            return True
    return False


def looks_like_default_skills(skills):
    if not skills:
        return False
    cleaned = {clean_text(skill) for skill in skills if str(skill).strip()}
    return bool(cleaned) and cleaned.issubset(DEFAULT_STARTER_SKILLS)


def build_skill_set(job_skills, trusted_context, user_prompt, job_description):
    current_skills = trusted_context.get("skills") or []
    if not trusted_context.get("trustSkills") and looks_like_default_skills(current_skills):
        current_skills = []

    prompt_skills = infer_skills_from_text(user_prompt)
    cv_text = trusted_context.get("text") or ""
    cv_inferred_skills = infer_skills_from_text(cv_text)
    job_inferred_skills = infer_skills_from_text(job_description)

    user_skills = unique_keep_order(
        normalize_skill_list([*current_skills, *prompt_skills, *cv_inferred_skills]),
        limit=16,
    )
    matched_job_skills = [skill for skill in job_skills if skill_matches(skill, user_skills)]
    missing_job_skills = [skill for skill in job_skills if not skill_matches(skill, user_skills)]

    if user_skills:
        skills = unique_keep_order(
            normalize_skill_list([*matched_job_skills, *user_skills, *missing_job_skills[:4], *job_inferred_skills]),
            limit=12,
        )
    else:
        skills = unique_keep_order(
            normalize_skill_list([*job_skills, *job_inferred_skills, *prompt_skills]),
            limit=12,
        )

    return skills, matched_job_skills, missing_job_skills, bool(user_skills)


def extract_user_signals(user_prompt, trusted_text):
    source = " ".join([user_prompt or "", trusted_text or ""])
    source_clean = clean_text(source)
    years = re.findall(r"(\d+)\s*(?:\+?\s*)?(?:nam|năm|year|years)", source_clean)
    projects = re.findall(r"(\d+)\s*(?:project|du an|dự án)", source_clean)
    return {
        "has_context": bool(source_clean.strip()),
        "years": years[0] if years else "",
        "projects": projects[0] if projects else "",
        "is_student": any(token in source_clean for token in ["sinh vien", "student", "moi ra truong", "thuc tap"]),
    }


def build_summary(job_title, company_name, profile, level_key, skills, user_signals, matched_skills, missing_skills, has_user_skills):
    skill_text = ", ".join(skills[:5]) if skills else "các kỹ năng liên quan"
    role = job_title or f"{profile['label']} Developer"
    company_part = f" tại {company_name}" if company_name else ""
    level_label = LEVEL_LABELS.get(level_key, "junior")

    if not has_user_skills and not user_signals["has_context"]:
        opener = f"Bản nháp định hướng ứng tuyển vị trí {role}{company_part}, nhắm tới các yêu cầu như {skill_text}."
    elif user_signals["years"]:
        opener = f"Ứng viên {role} có {user_signals['years']} năm kinh nghiệm/ thực hành với {skill_text}."
    elif user_signals["is_student"] or level_key in ["intern", "fresher"]:
        opener = f"Ứng viên {level_label} định hướng {role}{company_part}, có nền tảng về {skill_text}."
    else:
        opener = f"Ứng viên định hướng {role}{company_part}, tập trung phát triển năng lực với {skill_text}."

    if not has_user_skills and not user_signals["has_context"]:
        focus = "Cần bổ sung kinh nghiệm, dự án và mức độ thành thạo thật để CV đáng tin hơn."
    else:
        focus = f"Có khả năng {profile['summary']}."
    if matched_skills:
        close = f"CV ưu tiên làm nổi bật các kỹ năng khớp job như {', '.join(matched_skills[:4])}."
    elif missing_skills:
        close = "Bản nháp này đặt trọng tâm vào yêu cầu của job; bạn nên xóa hoặc chỉnh những kỹ năng chưa thật sự có."
    else:
        close = "Sẵn sàng học thêm công nghệ trong mô tả công việc và hoàn thiện sản phẩm qua dự án thực tế."
    return " ".join([opener, focus, close])


def tailor_lines(lines, job_title, skills, keywords, user_signals):
    skill_text = ", ".join(skills[:4]) if skills else "công nghệ phù hợp"
    keyword_text = ", ".join(keywords[:4]) if keywords else "yêu cầu nghiệp vụ"
    context_line = f"Bám sát vị trí {job_title or 'IT'} bằng cách nhấn mạnh {skill_text} và các từ khóa như {keyword_text}."
    if user_signals["projects"]:
        context_line = f"Làm nổi bật {user_signals['projects']} dự án đã có, ưu tiên các phần liên quan {skill_text}."
    return merge_lines(lines, [context_line], limit=4)


def enhance_basic_items(items, fallback_title, fallback_subtitle, fallback_lines, limit=2):
    existing = non_empty_items(items)
    if not existing:
        return [{
            "title": fallback_title,
            "subtitle": fallback_subtitle,
            "time": "2024 - Nay",
            "description": "\n".join(fallback_lines),
        }]

    enhanced = []
    for item in existing[:limit]:
        current_lines = split_description_lines(item.get("description"))
        next_item = dict(item)
        next_item["description"] = "\n".join(merge_lines(current_lines, fallback_lines[:2], limit=5))
        enhanced.append(next_item)
    return enhanced


def enhance_project_items(items, fallback_title, fallback_subtitle, fallback_lines, skills, limit=2):
    existing = non_empty_items(items)
    technologies = ", ".join(skills[:6])
    if not existing:
        return [{
            "title": fallback_title,
            "subtitle": fallback_subtitle,
            "time": "2026",
            "description": "\n".join(fallback_lines),
            "technologies": technologies,
        }]

    enhanced = []
    for item in existing[:limit]:
        current_lines = split_description_lines(item.get("description"))
        next_item = dict(item)
        next_item["description"] = "\n".join(merge_lines(current_lines, fallback_lines[:2], limit=5))
        next_item["technologies"] = item.get("technologies") or technologies
        enhanced.append(next_item)
    return enhanced


def generate_cv_for_job(payload):
    job_title = (payload.get("jobTitle") or "IT Developer").strip()
    company_name = (payload.get("companyName") or "").strip()
    job_description = strip_html(payload.get("jobDescription") or "")
    level = (payload.get("level") or "").strip()
    location = (payload.get("location") or "").strip()
    salary = payload.get("salary")
    quantity = payload.get("quantity")
    user_prompt = (payload.get("userPrompt") or "").strip()
    raw_job_skills = payload.get("skills") or []
    raw_job_skills = [str(skill).strip() for skill in raw_job_skills if str(skill).strip()]
    job_skills = normalize_skill_list(raw_job_skills)

    current_cv = payload.get("currentCv") or {}
    profile_data = payload.get("profile") or {}

    role_profile = detect_role_profile(job_title, job_description, [*raw_job_skills, *job_skills], user_prompt)
    level_key = detect_level(level, job_title, user_prompt)
    trusted_context = build_trusted_context(current_cv, job_title, company_name, user_prompt)
    user_signals = extract_user_signals(user_prompt, trusted_context["text"])
    skills, matched_skills, missing_skills, has_user_skills = build_skill_set(
        job_skills,
        trusted_context,
        user_prompt,
        job_description,
    )
    keywords = extract_keywords(" ".join([job_title, job_description, " ".join(job_skills)]), limit=10)

    summary = build_summary(
        job_title,
        company_name,
        role_profile,
        level_key,
        skills,
        user_signals,
        matched_skills,
        missing_skills,
        has_user_skills,
    )

    role_context = f"{job_title} tại {company_name}" if company_name else job_title
    experience_lines = tailor_lines(role_profile["experience"], job_title, skills, keywords, user_signals)
    project_lines = tailor_lines(role_profile["project"], job_title, skills, keywords, user_signals)

    experience_title = f"Kinh nghiệm / dự án liên quan {role_profile['label']}"
    experience_subtitle = "Kinh nghiệm / dự án cá nhân"
    if not user_signals["has_context"]:
        experience_subtitle = "Bản nháp cần bổ sung kinh nghiệm thật"
        experience_lines = merge_lines(
            [
                f"Bổ sung kinh nghiệm hoặc dự án thật liên quan vị trí {job_title or 'IT'} vào mục này.",
                "Nêu rõ vai trò của bạn, công nghệ đã dùng, chức năng đã làm và kết quả đạt được.",
            ],
            experience_lines[:2],
            limit=4,
        )

    experiences = enhance_basic_items(
        trusted_context["experiences"],
        experience_title,
        experience_subtitle,
        experience_lines,
    )

    project_title = role_profile["project_title"]
    project_subtitle = job_title
    if not user_signals["has_context"]:
        project_title = f"Dự án cá nhân liên quan {role_profile['label']}"
        project_subtitle = "Bản nháp cần thay bằng dự án thật"
        project_lines = merge_lines(
            [
                "Thay phần này bằng dự án thật của bạn, nêu rõ mục tiêu, vai trò, công nghệ và kết quả.",
                f"Ưu tiên dự án thể hiện được các yêu cầu chính của vị trí {job_title or role_profile['label']}.",
            ],
            project_lines[:2],
            limit=4,
        )

    projects = enhance_project_items(
        trusted_context["projects"],
        project_title,
        project_subtitle,
        project_lines,
        skills,
    )

    education = non_empty_items(current_cv.get("education"))
    certificates = trusted_context["certificates"]
    prompt_hint = user_prompt if user_prompt else "Người dùng chưa nhập nhiều kinh nghiệm, CV cần giữ nội dung trung thực ở mức bản nháp."

    missing_note = ""
    if missing_skills:
        missing_note = f" Mình cũng thấy job còn yêu cầu {', '.join(missing_skills[:4])}; hãy chỉ giữ trong CV nếu bạn thật sự có hoặc đang học."
    if not has_user_skills:
        missing_note += " Vì bạn chưa nhập nhiều dữ liệu cá nhân, bản nháp đang ưu tiên yêu cầu từ job và cần bạn rà lại để tránh ghi quá tay."

    salary_note = f" Mức lương job khoảng {salary:,.0f} đ nên phần CV cần thể hiện kết quả/dự án cụ thể hơn." if isinstance(salary, (int, float)) and salary else ""
    quantity_note = f" Job đang tuyển {quantity} người, nên CV cần ngắn gọn và làm nổi bật kỹ năng khớp nhất." if isinstance(quantity, int) and quantity <= 3 else ""

    chat_reply = (
        f"Mình đã tạo bản nháp CV theo hướng {role_profile['label']} cho vị trí {role_context}. "
        f"Phần mạnh nhất đang được ưu tiên: {', '.join(skills[:5]) if skills else 'kỹ năng phù hợp với mô tả job'}.{missing_note}{salary_note}{quantity_note} "
        "Bạn nên đọc lại từng mục và thay các mô tả mẫu bằng kinh nghiệm/dự án thật trước khi lưu hoặc ứng tuyển."
    )

    return {
        "fullName": current_cv.get("fullName") or profile_data.get("name") or "",
        "headline": job_title,
        "email": current_cv.get("email") or profile_data.get("email") or "",
        "phone": current_cv.get("phone") or "",
        "address": current_cv.get("address") or location or "Ho Chi Minh City",
        "website": current_cv.get("website") or "",
        "photo": current_cv.get("photo") or profile_data.get("avatar") or "",
        "targetRole": job_title,
        "summary": summary,
        "skills": skills,
        "languages": current_cv.get("languages") or "Tiếng Việt, Tiếng Anh đọc hiểu tài liệu",
        "theme": current_cv.get("theme") or "emerald",
        "experiences": experiences,
        "education": education,
        "projects": projects,
        "certificates": certificates,
        "chatReply": chat_reply,
        "aiInsights": {
            "role": role_profile["label"],
            "level": LEVEL_LABELS.get(level_key, level_key),
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "keywords": keywords,
            "hasUserSkills": has_user_skills,
            "hasUserContext": user_signals["has_context"],
            "ignoredGeneratedDraft": trusted_context["hasGeneratedContent"],
        },
        "jobContext": {
            "jobTitle": job_title,
            "companyName": company_name,
            "level": level,
            "location": location,
            "salary": salary,
            "quantity": quantity,
            "userPrompt": prompt_hint,
        },
    }
