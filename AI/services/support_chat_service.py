import re

from services.common import clean_text, contains_any, strip_vietnamese_accents


SMALL_TALK_KEYWORDS = [
    "ban dang lam gi", "dang lam gi", "bot dang lam gi", "tro ly dang lam gi",
    "ban lam gi do", "lam gi vay", "lam gi the", "co ai khong", "noi chuyen di",
    "noi chuyen voi toi", "ban co khoe khong", "khoe khong", "hom nay the nao",
    "ban o dau", "ai dang truc", "dang online khong",
]

AMBIGUOUS_HELP_KEYWORDS = [
    "giup toi", "ho tro toi", "can giup", "toi can giup", "help me", "help",
    "khong biet hoi gi", "bat dau tu dau", "lam sao bay gio", "phai lam sao",
    "toi nen lam gi bay gio",
]

DOMAIN_HINT_KEYWORDS = [
    "cv", "job", "viec", "ho so", "ung tuyen", "apply", "nop", "luu viec",
    "ban do", "map", "frontend", "backend", "tester", "java", "react", "vue",
    "phong van", "luong", "tai khoan", "dang nhap", "loi", "upload",
]

OFF_TOPIC_KEYWORDS = [
    "thoi tiet", "bong da", "ket qua tran", "co phieu", "crypto", "bitcoin",
    "nau an", "mon an", "an gi", "du lich", "dat ve", "xem phim", "nghe nhac",
    "ke chuyen cuoi", "truyen cuoi", "tin tuc nong", "boi toan", "tu vi",
    "yeu duong", "tam su tinh cam", "mua gi", "ban hang", "choi game",
    "game gi", "di dau choi", "anime", "doc truyen",
]


def is_short_prompt(plain):
    return len([word for word in plain.split(" ") if word]) <= 7


def build_support_reply(payload):
    message = (payload.get("message") or "").strip()
    path = (payload.get("path") or "").strip()
    is_authenticated = bool(payload.get("authenticated"))
    chat_history = payload.get("chatHistory") or []
    job_context = payload.get("jobContext") or {}
    job_title = (job_context.get("name") or job_context.get("jobTitle") or "").strip()
    job_id = job_context.get("id")

    plain = clean_text(strip_vietnamese_accents(message))
    lookup = f"{clean_text(message)} {plain}"
    recent_assistant = " ".join(
        str(item.get("content") or "")
        for item in chat_history[-4:]
        if isinstance(item, dict) and item.get("role") == "assistant"
    )
    recent_assistant_lookup = clean_text(strip_vietnamese_accents(recent_assistant))

    if not message:
        return {
            "reply": "Bạn cứ nhập điều mình cần hỗ trợ nhé. Mình giúp tốt nhất về tìm việc, tạo CV, nộp CV và xem hồ sơ đã nộp.",
            "suggestions": ["Cách tạo CV", "Cách nộp CV", "Tìm việc phù hợp"],
        }

    if contains_any(lookup, ["xin chao", "chao ban", "hello", "alo", "hey"]) or re.search(r"(^|\s)hi(\s|$)", plain):
        return {
            "reply": "Chào bạn, mình ở đây để hỗ trợ tìm việc, tạo CV, sửa CV và ứng tuyển trên IT Career. Bạn muốn bắt đầu phần nào?",
            "suggestions": ["Tìm việc phù hợp", "Tạo CV", "Tư vấn hướng IT"],
        }

    if contains_any(lookup, ["cam on", "thanks", "thank you", "ok roi", "duoc roi"]):
        return {
            "reply": "Không có gì nha. Khi cần, bạn có thể hỏi tiếp về CV, job phù hợp, cách ứng tuyển hoặc chuẩn bị phỏng vấn.",
            "suggestions": ["Tạo CV theo job", "Tìm việc phù hợp", "Chuẩn bị phỏng vấn"],
        }

    has_domain_hint = contains_any(plain, DOMAIN_HINT_KEYWORDS)

    if is_short_prompt(plain) and not has_domain_hint and contains_any(lookup, SMALL_TALK_KEYWORDS):
        return {
            "reply": "Mình đang sẵn sàng hỗ trợ bạn dùng IT Career nè. Bạn muốn tìm việc, tạo CV hay chỉnh CV cho phù hợp với job nào?",
            "suggestions": ["Tìm việc phù hợp", "Tạo CV", "Sửa CV theo job"],
        }

    if not has_domain_hint and contains_any(lookup, AMBIGUOUS_HELP_KEYWORDS):
        return {
            "reply": "Mình giúp được nhé. Bạn đang muốn tìm việc, tạo CV, sửa CV theo job, nộp hồ sơ hay xem trạng thái ứng tuyển?",
            "suggestions": ["Tìm việc phù hợp", "Tạo CV", "Xem trạng thái hồ sơ"],
        }

    if contains_any(lookup, ["ban la ai", "ai day", "tro ly gi", "chatbot nay la gi"]):
        return {
            "reply": (
                "Mình là trợ lý hỗ trợ tuyển dụng của IT Career. Mình không thay HR quyết định kết quả, "
                "nhưng có thể giúp bạn hiểu job, viết CV sát yêu cầu, chuẩn bị phỏng vấn, lưu việc, nộp CV và theo dõi hồ sơ."
            ),
            "suggestions": ["Bạn làm được gì?", "Cách tạo CV", "Cách nộp CV"],
        }

    if contains_any(lookup, [
        "cv gia", "fake cv", "noi doi", "khai gian", "kinh nghiem gia",
        "lam gia", "bang cap gia", "thong tin sai", "khong co kinh nghiem nhung ghi"
    ]):
        return {
            "reply": (
                "Mình không hỗ trợ tạo thông tin sai sự thật trong CV. "
                "Nhưng mình có thể giúp bạn viết lại kinh nghiệm thật cho chuyên nghiệp hơn, nhấn mạnh dự án, kỹ năng, quá trình học và điểm mạnh phù hợp với job."
            ),
            "suggestions": ["Viết CV trung thực", "Gợi ý dự án nên ghi", "Tạo CV theo job"],
        }

    if contains_any(lookup, [
        "hack", "tan cong", "lay mat khau", "crack", "lua dao", "spam",
        "phishing", "ma doc", "virus", "vuot bao mat"
    ]):
        return {
            "reply": (
                "Mình không thể hỗ trợ nội dung gây hại hoặc xâm phạm hệ thống. "
                "Nếu bạn quan tâm mảng bảo mật theo hướng hợp pháp, mình có thể gợi ý kỹ năng, chứng chỉ và cách viết CV cybersecurity."
            ),
            "suggestions": ["CV cybersecurity", "Kỹ năng bảo mật", "Tìm việc IT"],
        }

    if contains_any(lookup, [
        "lam duoc gi", "ho tro gi", "ban biet gi", "ngoai may cai", "ngoai nhung cai",
        "cai gi khac", "chuc nang gi", "ban co the lam gi"
    ]):
        return {
            "reply": (
                "Mình hỗ trợ các việc chính trên IT Career: tìm job phù hợp, tạo/sửa CV theo job, chuẩn bị phỏng vấn, "
                "nộp CV, lưu việc, xem trạng thái hồ sơ và dùng bản đồ việc làm. Bạn có thể hỏi tự nhiên, không cần bấm đúng nút gợi ý."
            ),
            "suggestions": ["Tư vấn hướng IT", "Sửa nội dung CV", "Chuẩn bị phỏng vấn"],
        }

    if contains_any(lookup, [
        "mong lung", "khong biet minh hop", "khong biet hop", "khong biet nen lam gi",
        "mat dinh huong", "chua biet chon", "nen theo nghe nao", "hop nghe gi",
        "nen lam frontend hay backend", "nen lam tester hay dev"
    ]):
        return {
            "reply": (
                "Không sao, phần này nhiều bạn mới học IT cũng gặp. Bạn có thể tự lọc nhanh thế này: "
                "thích giao diện và thấy kết quả trực quan thì thử frontend; thích logic, API, dữ liệu thì backend; "
                "thích kiểm tra lỗi và quy trình thì tester; thích điều phối nhóm thì project manager. "
                "Bạn nói cho mình 3 kỹ năng bạn đang biết và mức hiện tại, mình sẽ gợi ý hướng phù hợp hơn."
            ),
            "suggestions": ["Tư vấn frontend", "Tư vấn backend", "Tư vấn tester"],
        }

    if contains_any(lookup, [
        "cv xau", "cv trong", "cv em trong", "cv toi trong", "cv trong qua", "cv yeu", "cv thieu",
        "cv khong co gi", "khong co kinh nghiem", "chua co kinh nghiem", "it kinh nghiem",
        "moi ra truong", "sinh vien", "thuc tap", "intern", "fresher", "chua co du an"
    ]):
        return {
            "reply": (
                "CV chưa mạnh vẫn cải thiện được. Bạn nên tập trung vào 3 phần: kỹ năng đúng với job, 1-2 dự án có mô tả rõ vai trò, "
                "và kết quả cụ thể như chức năng đã làm, công nghệ dùng, vấn đề đã giải quyết. "
                "Nếu chưa có kinh nghiệm công ty, hãy ghi project học tập hoặc thực tập thật, tránh phóng đại."
            ),
            "suggestions": ["Gợi ý dự án nên ghi", "Viết lại mô tả dự án", "Tạo CV theo job"],
        }

    if contains_any(lookup, [
        "cv nay thieu gi", "kiem tra cv", "danh gia cv", "cv co on khong", "cv co tot khong",
        "sua cv", "review cv", "toi uu cv"
    ]):
        return {
            "reply": (
                "Mình có thể giúp bạn rà CV theo hướng tuyển dụng. Bạn hãy mở trang Tạo CV hoặc gửi CV vào job cụ thể, "
                "hệ thống sẽ có phần AI đánh giá mức phù hợp. Nếu chỉ hỏi trong chat, bạn có thể dán phần kỹ năng/dự án chính để mình gợi ý cách chỉnh."
            ),
            "suggestions": ["Tạo CV", "AI đánh giá CV", "Dự án nên ghi"],
        }

    if contains_any(lookup, [
        "nen apply job nao", "apply job nao", "viec nao hop", "job nao hop", "tim job cho toi",
        "em biet", "toi biet", "co nen ung tuyen", "du dieu kien khong"
    ]):
        extra = f" Riêng job {job_title}, bạn nên so CV với kỹ năng yêu cầu trước khi nộp." if job_title else ""
        return {
            "reply": (
                "Để chọn job phù hợp, bạn nên so 3 thứ: kỹ năng chính, level và địa điểm/mức lương. "
                "Nếu bạn khớp khoảng 60-70% kỹ năng chính thì vẫn nên ứng tuyển, nhất là vị trí intern/fresher/junior. "
                "Bạn có thể nói mình biết kỹ năng hiện có, mình sẽ gợi ý nhóm job nên tìm."
                + extra
            ),
            "suggestions": ["Tìm job theo kỹ năng", "Tạo CV theo job", "Nên học gì thêm?"],
        }

    if contains_any(lookup, [
        "loi", "khong upload", "khong tai", "khong dang nhap", "khong mo duoc", "bi loi",
        "khong thay", "khong hien", "khong luu duoc", "khong nop duoc"
    ]):
        return {
            "reply": (
                "Mình có thể hướng dẫn kiểm tra lỗi thao tác. Bạn thử mô tả thêm: bạn đang ở trang nào, bấm nút nào, "
                "và màn hình báo gì. Với lỗi nộp CV thường cần kiểm tra đăng nhập, định dạng file, dung lượng file và backend có đang chạy không."
            ),
            "suggestions": ["Lỗi nộp CV", "Lỗi đăng nhập", "Lỗi upload file"],
        }

    if contains_any(lookup, [
        "luong bao nhieu", "muc luong", "salary", "deal luong", "thuong luong", "doi luong",
        "luong fresher", "luong intern", "luong junior"
    ]):
        return {
            "reply": (
                "Về lương, bạn nên dựa vào level, kỹ năng chính, kinh nghiệm dự án và mặt bằng job đang đăng. "
                "Khi phỏng vấn, hãy nói khoảng lương mong muốn thay vì một con số cứng, và gắn nó với năng lực cụ thể của bạn."
            ),
            "suggestions": ["Tìm job theo lương", "Chuẩn bị phỏng vấn", "Cách ghi mức lương"],
        }

    if contains_any(lookup, [
        "phong van", "interview", "hoi gi", "cau hoi phong van", "run qua", "lo phong van",
        "chuan bi phong van", "tra loi phong van"
    ]):
        return {
            "reply": (
                "Chuẩn bị phỏng vấn nên đi theo 4 phần: ôn kỹ năng chính của job, nắm rõ project trong CV, "
                "chuẩn bị 2-3 tình huống bạn từng xử lý lỗi/khó khăn, và luyện cách giới thiệu bản thân trong 60 giây. "
                "Nếu bạn nói vị trí muốn phỏng vấn, mình sẽ gợi ý câu hỏi sát hơn."
            ),
            "suggestions": ["Phỏng vấn frontend", "Phỏng vấn backend", "Giới thiệu bản thân"],
        }

    if contains_any(lookup, OFF_TOPIC_KEYWORDS):
        return {
            "reply": (
                "Mình chủ yếu hỗ trợ về tìm việc, CV và ứng tuyển trên IT Career nên chủ đề này mình xin trả lời ngắn thôi. "
                "Bạn muốn mình giúp chọn job phù hợp, sửa CV hay chuẩn bị phỏng vấn không?"
            ),
            "suggestions": ["Tìm việc phù hợp", "Tạo CV", "Chuẩn bị phỏng vấn"],
        }

    if contains_any(lookup, [
        "dinh huong", "nen hoc", "hoc gi", "lo trinh", "roadmap", "phong van",
        "interview", "portfolio", "du an nen ghi", "muc luong", "salary",
        "intern", "fresher", "junior", "senior", "tester", "frontend", "backend"
    ]):
        extra = f" Với job {job_title}, bạn nên bám sát kỹ năng yêu cầu trong mô tả và dùng CV Builder để viết bản nháp theo job." if job_title else ""
        return {
            "reply": (
                "Mình có thể tư vấn theo hướng nghề nghiệp IT. Bạn nên cho mình biết vị trí bạn nhắm tới, kỹ năng hiện có và level hiện tại. "
                "Từ đó mình sẽ gợi ý kỹ năng cần học, dự án nên đưa vào CV và cách trình bày để khớp với job hơn."
                + extra
            ),
            "suggestions": ["Tư vấn frontend", "Dự án nên ghi vào CV", "Câu hỏi phỏng vấn"],
        }

    if contains_any(lookup, ["nop cv", "ung tuyen", "apply", "gui cv"]):
        return {
            "reply": (
                "Để nộp CV, bạn mở chi tiết công việc rồi bấm Apply Now. "
                "Nếu chưa đăng nhập, hệ thống sẽ đưa bạn sang trang đăng nhập trước. "
                "Sau đó bạn chọn file CV và gửi hồ sơ cho nhà tuyển dụng."
            ),
            "suggestions": ["Tạo CV trước khi nộp", "Xem hồ sơ đã nộp"],
        }

    if contains_any(lookup, ["tao cv", "viet cv", "cv theo job", "cv phu hop"]):
        if job_title and job_id:
            return {
                "reply": (
                    f"Bạn đang xem công việc {job_title}. Bạn có thể bấm nút Tạo CV cho job này, "
                    "hoặc mở trang tạo CV để AI lấy yêu cầu công việc và viết bản nháp phù hợp. "
                    "Sau khi AI tạo xong, bạn nên kiểm tra lại kinh nghiệm/dự án cho đúng thực tế."
                ),
                "suggestions": ["Mở tạo CV cho job này", "Nên ghi gì trong CV?"],
                "action": {"type": "OPEN_CV_BUILDER", "jobId": job_id},
            }

        return {
            "reply": (
                "Bạn vào mục Tạo CV trên thanh menu. Nếu muốn CV khớp với một việc làm cụ thể, "
                "hãy mở chi tiết job rồi bấm Tạo CV cho job này. AI sẽ hỏi thêm kỹ năng/dự án của bạn và điền bản nháp vào CV Builder."
            ),
            "suggestions": ["Tìm việc trước", "Mẹo viết CV IT"],
        }

    if contains_any(lookup, ["trang thai", "pending", "reviewing", "approved", "rejected", "ho so"]):
        if not is_authenticated:
            return {
                "reply": "Bạn cần đăng nhập để xem trạng thái hồ sơ đã nộp. Sau khi đăng nhập, mở menu tài khoản và chọn Quản lý tài khoản để xem danh sách CV đã ứng tuyển.",
                "suggestions": ["Đăng nhập", "Cách nộp CV"],
            }

        return {
            "reply": (
                "Bạn xem trạng thái hồ sơ trong phần Quản lý tài khoản. "
                "PENDING là đang chờ HR xem, REVIEWING là đang được xem xét, APPROVED là được chấp thuận, "
                "REJECTED là chưa phù hợp, FULL là công việc đã đủ số lượng tuyển."
            ),
            "suggestions": ["Cách cải thiện CV", "Tạo CV mới"],
        }

    if contains_any(lookup, ["luu viec", "da luu", "trai tim", "yeu thich"]):
        return {
            "reply": (
                "Bạn bấm biểu tượng trái tim trên card việc làm hoặc trang chi tiết job để lưu. "
                "Danh sách việc làm đã lưu nằm ở nút trái tim nổi góc dưới bên phải."
            ),
            "suggestions": ["Tìm việc phù hợp", "Cách nộp CV"],
        }

    if contains_any(lookup, ["ban do", "map", "duong di", "vi tri"]):
        return {
            "reply": (
                "Bạn vào mục Bản đồ để xem các việc làm có tọa độ. "
                "Có thể lọc theo kỹ năng/trình độ, xem vị trí công ty và mở đường đi từ vị trí của bạn nếu trình duyệt cho phép lấy vị trí."
            ),
            "suggestions": ["Lọc việc trên bản đồ", "Tìm việc ở TPHCM"],
        }

    if contains_any(lookup, ["tim viec", "viec phu hop", "frontend", "backend", "tester", "java", "react", "vue"]):
        extra = f" Nếu bạn đang quan tâm job {job_title}, hãy xem kỹ kỹ năng yêu cầu và dùng nút Tạo CV cho job này." if job_title else ""
        return {
            "reply": (
                "Bạn nên tìm theo kỹ năng chính, địa điểm và level mong muốn. "
                "Khi thấy job phù hợp, hãy đọc mô tả, lưu job lại và tạo CV hướng đúng yêu cầu của job đó."
                + extra
            ),
            "suggestions": ["Tạo CV theo job", "Cách nộp CV"],
        }

    if contains_any(lookup, ["dang nhap", "tai khoan", "mat khau", "quen mat khau"]):
        return {
            "reply": (
                "Nếu chưa có tài khoản, bạn chọn Đăng ký. Nếu quên mật khẩu, chọn Quên mật khẩu ở trang đăng nhập để nhận liên kết đặt lại mật khẩu."
            ),
            "suggestions": ["Quên mật khẩu", "Tạo tài khoản"],
        }

    context_reply = f" Mình thấy bạn đang ở trang {path}." if path else ""
    if job_title:
        context_reply += f" Công việc hiện tại là {job_title}."

    if "minh co the ho tro ban dung web tuyen dung it career" in recent_assistant_lookup:
        return {
            "reply": (
                "Mình chưa bắt đúng ý câu này nên hỏi lại cho chắc nhé: bạn cần tìm job, sửa CV, chuẩn bị phỏng vấn hay xử lý lỗi thao tác?"
            ),
            "suggestions": ["Gợi ý job theo kỹ năng", "Sửa CV yếu", "Báo lỗi thao tác"],
        }

    return {
        "reply": (
            "Ý này mình chưa bắt chắc. Bạn có thể nói rõ mục tiêu hơn: tìm job, sửa CV, chọn hướng nghề, phỏng vấn, "
            f"nộp hồ sơ hoặc lỗi thao tác.{context_reply} Ví dụ: 'CV tôi chưa có kinh nghiệm thì ghi gì?' hoặc 'tôi biết Java thì nên apply job nào?'."
        ),
        "suggestions": ["CV chưa có kinh nghiệm", "Tôi biết Java", "Lỗi nộp CV"],
    }
