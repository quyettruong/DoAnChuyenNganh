import { useEffect, useMemo, useRef, useState } from "react";
import {
    App as AntdApp,
    Button,
    Divider,
    Form,
    Input,
    Popconfirm,
    Row,
    Col,
    Segmented,
    Select,
    Space,
    Tag,
    Upload,
} from "antd";
import {
    DeleteOutlined,
    FileTextOutlined,
    LoadingOutlined,
    PlusOutlined,
    PrinterOutlined,
    RobotOutlined,
    SaveOutlined,
    SendOutlined,
    ThunderboltOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    callCreateUserCv,
    callFetchJobById,
    callFetchUserCvById,
    callGenerateCvFromJob,
    callUpdateUserCv,
    callUploadSingleFile,
} from "@/config/api";
import { IJob, IUserCvPayload } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import styles from "styles/client.module.scss";

const { TextArea } = Input;

type CvTheme = "emerald" | "blue" | "slate";
type EditableListKey = "experiences" | "education" | "projects" | "certificates";
type AiMessageRole = "assistant" | "user";

interface AiChatMessage {
    id: string;
    role: AiMessageRole;
    content: string;
}

interface CvBasicItem {
    id: string;
    title: string;
    subtitle: string;
    time: string;
    description: string;
}

interface CvProjectItem extends CvBasicItem {
    technologies: string;
}

interface CvData {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    photo: string;
    targetRole: string;
    summary: string;
    skills: string[];
    languages: string;
    theme: CvTheme;
    experiences: CvBasicItem[];
    education: CvBasicItem[];
    projects: CvProjectItem[];
    certificates: CvBasicItem[];
}

const LEGACY_CV_STORAGE_KEY = "itcareer_cv_builder_draft";
const CV_STORAGE_KEY_PREFIX = "itcareer_cv_builder_draft_v2";

const buildCvDraftStorageKey = (
    isAuthenticated: boolean,
    user?: { id?: string; email?: string },
) => {
    const owner = isAuthenticated && (user?.id || user?.email)
        ? `user:${user.id || user.email}`
        : "guest";

    return `${CV_STORAGE_KEY_PREFIX}:${owner}`;
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createBasicItem = (title = "", subtitle = "", time = "", description = ""): CvBasicItem => ({
    id: createId(),
    title,
    subtitle,
    time,
    description,
});

const createProjectItem = (
    title = "",
    subtitle = "",
    time = "",
    description = "",
    technologies = "",
): CvProjectItem => ({
    id: createId(),
    title,
    subtitle,
    time,
    description,
    technologies,
});

const normalizeBasicItem = (item: Partial<CvBasicItem> = {}): CvBasicItem => ({
    id: item.id || createId(),
    title: item.title || "",
    subtitle: item.subtitle || "",
    time: item.time || "",
    description: item.description || "",
});

const normalizeProjectItem = (item: Partial<CvProjectItem> = {}): CvProjectItem => ({
    ...normalizeBasicItem(item),
    technologies: item.technologies || "",
});

const createDefaultCv = (name = "", email = "", photo = ""): CvData => ({
    fullName: name,
    headline: "Frontend Developer",
    email,
    phone: "",
    address: "Ho Chi Minh City",
    website: "",
    photo,
    targetRole: "Frontend Developer",
    summary: "",
    skills: ["React", "TypeScript", "HTML/CSS"],
    languages: "Tiếng Việt, Tiếng Anh cơ bản",
    theme: "emerald",
    experiences: [createBasicItem()],
    education: [createBasicItem()],
    projects: [createProjectItem()],
    certificates: [],
});

const skillOptions = [
    "React",
    "TypeScript",
    "JavaScript",
    "HTML/CSS",
    "Java",
    "Spring Boot",
    "Node.js",
    "SQL",
    "Git",
    "REST API",
    "Testing",
    "Figma",
].map(value => ({ value, label: value }));

const themeOptions = [
    { value: "emerald", label: "Xanh lá" },
    { value: "blue", label: "Xanh dương" },
    { value: "slate", label: "Tối giản" },
];

const hasContent = (item: CvBasicItem) =>
    Boolean(item.title.trim() || item.subtitle.trim() || item.time.trim() || item.description.trim());

const splitLines = (value: string) =>
    value
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

const CvBuilderPage = () => {
    const { message } = AntdApp.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const editingCvId = searchParams.get("id");
    const jobId = searchParams.get("jobId");
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const isAccountLoading = useAppSelector(state => state.account.isLoading);
    const user = useAppSelector(state => state.account.user);
    const draftStorageKey = useMemo(
        () => buildCvDraftStorageKey(isAuthenticated, {
            id: user?.id,
            email: user?.email,
        }),
        [isAuthenticated, user?.email, user?.id],
    );
    const loadedDraftKeyRef = useRef<string | null>(null);
    const [currentCvId, setCurrentCvId] = useState<string | null>(editingCvId);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [jobTarget, setJobTarget] = useState<IJob | null>(null);
    const [loadingJobTarget, setLoadingJobTarget] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
    const [cv, setCv] = useState<CvData>(() => createDefaultCv());
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAccountLoading || editingCvId) return;

        localStorage.removeItem(LEGACY_CV_STORAGE_KEY);

        const stored = localStorage.getItem(draftStorageKey);
        if (stored) {
            try {
                const parsedDraft = JSON.parse(stored) as Partial<CvData>;
                setCv({ ...createDefaultCv(user?.name || "", user?.email || "", user?.avatar || ""), ...parsedDraft });
                loadedDraftKeyRef.current = draftStorageKey;
                return;
            } catch {
                localStorage.removeItem(draftStorageKey);
            }
        }

        if (loadedDraftKeyRef.current !== draftStorageKey) {
            setCv(createDefaultCv(user?.name || "", user?.email || "", user?.avatar || ""));
            loadedDraftKeyRef.current = draftStorageKey;
            return;
        }

        setCv(previous => ({
            ...previous,
            fullName: previous.fullName || user?.name || "",
            email: previous.email || user?.email || "",
            photo: previous.photo || user?.avatar || "",
        }));
    }, [draftStorageKey, editingCvId, isAccountLoading, user?.avatar, user?.email, user?.name]);

    useEffect(() => {
        if (!jobId) {
            setJobTarget(null);
            setAiMessages([]);
            return;
        }

        let mounted = true;
        setLoadingJobTarget(true);
        callFetchJobById(jobId)
            .then(res => {
                if (!mounted) return;
                if (res?.data) {
                    setJobTarget(res.data);
                    setAiMessages([
                        {
                            id: createId(),
                            role: "assistant",
                            content: `Mình đã lấy thông tin job "${res.data.name}". Hãy nhập kinh nghiệm, kỹ năng hoặc dự án của bạn, mình sẽ tạo CV nhắm đúng công việc này.`,
                        },
                    ]);
                    setCv(previous => ({
                        ...previous,
                        targetRole: previous.targetRole || res.data?.name || "",
                        headline: previous.headline || res.data?.name || "",
                        skills: previous.skills?.length
                            ? previous.skills
                            : res.data?.skills?.map(item => item.name || "").filter(Boolean) || previous.skills,
                    }));
                }
            })
            .finally(() => {
                if (mounted) setLoadingJobTarget(false);
            });

        return () => {
            mounted = false;
        };
    }, [jobId]);

    useEffect(() => {
        if (!editingCvId) {
            setCurrentCvId(null);
            return;
        }

        if (isAccountLoading) return;

        if (!isAuthenticated) {
            const callback = `${location.pathname}${location.search}`;
            navigate(`/login?callback=${encodeURIComponent(callback)}`);
            return;
        }

        let mounted = true;
        callFetchUserCvById(editingCvId).then(res => {
            if (!mounted) return;

            if (res?.data?.cvData) {
                try {
                    const parsedCv = JSON.parse(res.data.cvData) as CvData;
                    setCv({ ...createDefaultCv(user?.name || "", user?.email || "", user?.avatar || ""), ...parsedCv });
                    setCurrentCvId(res.data.id?.toString() || editingCvId);
                } catch {
                    message.error("Không thể đọc dữ liệu CV đã lưu");
                }
            }
        });

        return () => {
            mounted = false;
        };
    }, [editingCvId, isAccountLoading, isAuthenticated, location.pathname, location.search, message, navigate, user?.avatar, user?.email, user?.name]);

    const visibleExperiences = useMemo(() => cv.experiences.filter(hasContent), [cv.experiences]);
    const visibleEducation = useMemo(() => cv.education.filter(hasContent), [cv.education]);
    const visibleProjects = useMemo(() => cv.projects.filter(hasContent), [cv.projects]);
    const visibleCertificates = useMemo(() => cv.certificates.filter(hasContent), [cv.certificates]);

    const updateField = <K extends keyof CvData>(field: K, value: CvData[K]) => {
        setCv(previous => ({ ...previous, [field]: value }));
    };

    const updateListItem = (
        listKey: EditableListKey,
        id: string,
        field: keyof CvBasicItem | keyof CvProjectItem,
        value: string,
    ) => {
        setCv(previous => ({
            ...previous,
            [listKey]: previous[listKey].map(item =>
                item.id === id ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const addItem = (listKey: EditableListKey) => {
        setCv(previous => ({
            ...previous,
            [listKey]: [
                ...previous[listKey],
                listKey === "projects" ? createProjectItem() : createBasicItem(),
            ],
        }));
    };

    const removeItem = (listKey: EditableListKey, id: string) => {
        setCv(previous => ({
            ...previous,
            [listKey]: previous[listKey].filter(item => item.id !== id),
        }));
    };

    const beforeUploadPhoto = (file: any) => {
        const isImage = file.type === "image/jpeg" || file.type === "image/png";
        if (!isImage) {
            message.error("Chỉ hỗ trợ ảnh JPG/PNG");
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error("Ảnh cần nhỏ hơn 2MB");
        }

        return isImage && isLt2M;
    };

    const handleUploadPhoto = async ({ file, onSuccess, onError }: any) => {
        setUploadingPhoto(true);
        const res = await callUploadSingleFile(file, "avatar");
        setUploadingPhoto(false);

        if (res?.data?.fileName) {
            updateField("photo", res.data.fileName);
            message.success("Đã thêm ảnh cá nhân vào CV");
            onSuccess?.("ok");
            return;
        }

        const error = new Error(res?.message || "Upload ảnh thất bại");
        onError?.({ event: error });
        message.error(error.message);
    };

    const buildCvTitle = () => {
        const role = cv.targetRole?.trim() || cv.headline?.trim() || "CV cá nhân";
        const name = cv.fullName?.trim();
        return name ? `${role} - ${name}` : role;
    };

    const updateSearchCvId = (id?: string) => {
        const nextParams: Record<string, string> = {};
        if (id) nextParams.id = id;
        if (jobId) nextParams.jobId = jobId;
        setSearchParams(nextParams);
    };

    const buildUserCvPayload = (): IUserCvPayload => ({
        title: buildCvTitle(),
        templateCode: "itcareer-basic",
        theme: cv.theme,
        cvData: JSON.stringify(cv),
        defaultCv: false,
    });

    const handleSaveDraft = async () => {
        localStorage.setItem(draftStorageKey, JSON.stringify(cv));

        if (isAccountLoading) {
            message.info("Đang kiểm tra tài khoản, bạn thử lưu lại sau vài giây");
            return;
        }

        if (!isAuthenticated) {
            const callback = `${location.pathname}${location.search}`;
            message.info("Bạn cần đăng nhập để lưu CV vào tài khoản");
            navigate(`/login?callback=${encodeURIComponent(callback)}`);
            return;
        }

        setSaving(true);
        const payload = buildUserCvPayload();
        const res = currentCvId
            ? await callUpdateUserCv(currentCvId, payload)
            : await callCreateUserCv(payload);
        setSaving(false);

        if (res?.data?.id) {
            setCurrentCvId(res.data.id.toString());
            updateSearchCvId(res.data.id.toString());
            message.success(currentCvId ? "Đã cập nhật CV" : "Đã lưu CV vào tài khoản");
            return;
        }

        message.error(res?.message || "Không thể lưu CV");
    };

    const handleClearDraft = () => {
        const nextCv = createDefaultCv(user?.name || "", user?.email || "", user?.avatar || "");
        setCv(nextCv);
        setCurrentCvId(null);
        updateSearchCvId();
        localStorage.removeItem(draftStorageKey);
        message.success("Đã tạo lại CV mới");
    };

    const handlePrint = () => {
        localStorage.setItem(draftStorageKey, JSON.stringify(cv));
        window.print();
    };

    const handleGenerateSuggestion = () => {
        const targetRole = cv.targetRole.trim() || cv.headline.trim() || "Frontend Developer";
        const skills = cv.skills.length ? cv.skills : ["React", "TypeScript", "REST API"];
        const skillText = skills.slice(0, 5).join(", ");

        setCv(previous => ({
            ...previous,
            headline: previous.headline || targetRole,
            summary: `Ứng viên định hướng ${targetRole} với nền tảng về ${skillText}. Có khả năng xây dựng giao diện rõ ràng, làm việc với API, xử lý dữ liệu phía client và phối hợp với nhóm để hoàn thiện sản phẩm đúng yêu cầu.`,
            experiences: [
                createBasicItem(
                    targetRole,
                    "Dự án học tập / thực tập",
                    "2024 - 2026",
                    `Phát triển các màn hình người dùng bằng ${skills.slice(0, 3).join(", ")}.\nTích hợp API, xử lý trạng thái giao diện và kiểm tra luồng nghiệp vụ.\nPhối hợp sửa lỗi, tối ưu trải nghiệm người dùng và tài liệu hóa chức năng.`,
                ),
            ],
            projects: [
                createProjectItem(
                    "IT Career Platform",
                    targetRole,
                    "2026",
                    "Xây dựng website tuyển dụng IT có tìm kiếm việc làm, xem công ty, bản đồ việc làm và quản lý hồ sơ ứng tuyển.\nThiết kế giao diện responsive, tối ưu trải nghiệm xem chi tiết công việc và lưu việc làm.",
                    skills.slice(0, 5).join(", "),
                ),
            ],
        }));
        message.success("Đã tạo gợi ý nội dung CV");
    };

    const applyAiCvDraft = (draft: Partial<CvData> & { chatReply?: string }) => {
        setCv(previous => {
            const nextCv: CvData = {
                ...previous,
                fullName: draft.fullName || previous.fullName,
                headline: draft.headline || previous.headline,
                email: draft.email || previous.email,
                phone: draft.phone || previous.phone,
                address: draft.address || previous.address,
                website: draft.website || previous.website,
                photo: draft.photo || previous.photo,
                targetRole: draft.targetRole || previous.targetRole,
                summary: draft.summary || previous.summary,
                skills: Array.isArray(draft.skills) && draft.skills.length ? draft.skills : previous.skills,
                languages: draft.languages || previous.languages,
                theme: draft.theme || previous.theme,
                experiences: Array.isArray(draft.experiences) && draft.experiences.length
                    ? draft.experiences.map(item => normalizeBasicItem(item))
                    : previous.experiences,
                education: Array.isArray(draft.education) && draft.education.length
                    ? draft.education.map(item => normalizeBasicItem(item))
                    : previous.education,
                projects: Array.isArray(draft.projects) && draft.projects.length
                    ? draft.projects.map(item => normalizeProjectItem(item))
                    : previous.projects,
                certificates: Array.isArray(draft.certificates) && draft.certificates.length
                    ? draft.certificates.map(item => normalizeBasicItem(item))
                    : previous.certificates,
            };

            localStorage.setItem(draftStorageKey, JSON.stringify(nextCv));
            return nextCv;
        });
    };

    const handleAiGenerateFromJob = async () => {
        if (!jobTarget?.id) {
            message.warning("Chưa có công việc để AI tạo CV");
            return;
        }

        const prompt = aiPrompt.trim();
        setAiMessages(previous => [
            ...previous,
            {
                id: createId(),
                role: "user",
                content: prompt || "Tạo CV phù hợp với công việc này dựa trên thông tin hiện có.",
            },
        ]);
        setAiGenerating(true);

        const res = await callGenerateCvFromJob(jobTarget.id, {
            userPrompt: prompt,
            currentCv: cv as unknown as Record<string, any>,
            profile: {
                name: user?.name,
                email: user?.email,
                avatar: user?.avatar,
            },
        });

        setAiGenerating(false);

        if (res?.statusCode === 200 && res.data) {
            applyAiCvDraft(res.data);
            setAiPrompt("");
            setAiMessages(previous => [
                ...previous,
                {
                    id: createId(),
                    role: "assistant",
                    content: res.data.chatReply || "Mình đã tạo bản nháp CV phù hợp với công việc này. Bạn hãy kiểm tra lại trước khi lưu hoặc xuất PDF.",
                },
            ]);
            message.success("AI đã tạo bản nháp CV theo job");
            return;
        }

        setAiMessages(previous => [
            ...previous,
            {
                id: createId(),
                role: "assistant",
                content: res?.message || "Mình chưa tạo được CV lúc này. Bạn thử nhập thêm kỹ năng hoặc dự án cụ thể hơn nhé.",
            },
        ]);
        message.error(res?.message || "Không thể tạo CV bằng AI");
    };

    const renderBasicEditor = (title: string, listKey: "experiences" | "education" | "certificates") => (
        <div className={styles["cv-editor-section"]}>
            <div className={styles["cv-editor-section-head"]}>
                <h3>{title}</h3>
                <Button icon={<PlusOutlined />} onClick={() => addItem(listKey)}>
                    Thêm
                </Button>
            </div>

            {cv[listKey].map((item, index) => (
                <div className={styles["cv-editor-item"]} key={item.id}>
                    <div className={styles["cv-editor-item-head"]}>
                        <span>Mục {index + 1}</span>
                        {cv[listKey].length > 1 && (
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeItem(listKey, item.id)}
                            />
                        )}
                    </div>
                    <Row gutter={[10, 10]}>
                        <Col xs={24} md={12}>
                            <Input
                                placeholder={listKey === "education" ? "Trường / chứng chỉ" : "Vị trí / tên mục"}
                                value={item.title}
                                onChange={event => updateListItem(listKey, item.id, "title", event.target.value)}
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <Input
                                placeholder={listKey === "education" ? "Ngành học / đơn vị" : "Công ty / tổ chức"}
                                value={item.subtitle}
                                onChange={event => updateListItem(listKey, item.id, "subtitle", event.target.value)}
                            />
                        </Col>
                        <Col span={24}>
                            <Input
                                placeholder="Thời gian, ví dụ: 2022 - 2026"
                                value={item.time}
                                onChange={event => updateListItem(listKey, item.id, "time", event.target.value)}
                            />
                        </Col>
                        <Col span={24}>
                            <TextArea
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                placeholder="Mỗi dòng là một ý chính..."
                                value={item.description}
                                onChange={event => updateListItem(listKey, item.id, "description", event.target.value)}
                            />
                        </Col>
                    </Row>
                </div>
            ))}
        </div>
    );

    return (
        <div className={`${styles["container"]} ${styles["cv-builder-page"]}`}>
            <section className={styles["cv-builder-hero"]}>
                <div>
                    <span className={styles["hero-eyebrow"]}>CV Builder</span>
                    <h1>Tạo CV IT rõ ràng, gọn gàng và sẵn sàng ứng tuyển</h1>
                    <p>
                        Nhập thông tin một lần, xem trước trực tiếp theo khổ A4, lưu bản nháp và xuất PDF bằng trình duyệt.
                    </p>
                </div>
                <Space wrap>
                    <Button icon={<ThunderboltOutlined />} onClick={handleGenerateSuggestion}>
                        Tạo gợi ý nhanh
                    </Button>
                    <Button icon={<SaveOutlined />} loading={saving} onClick={handleSaveDraft}>
                        {currentCvId ? "Cập nhật CV" : "Lưu CV"}
                    </Button>
                    <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                        Xuất PDF
                    </Button>
                </Space>
            </section>

            <div className={styles["cv-builder-shell"]}>
                <aside className={styles["cv-editor-panel"]}>
                    <div className={styles["cv-panel-title"]}>
                        <FileTextOutlined />
                        <div>
                            <h2>Thông tin CV</h2>
                            <p>Các thay đổi sẽ hiện ngay ở bản xem trước.</p>
                        </div>
                    </div>

                    {jobId && (
                        <div className={styles["cv-ai-box"]}>
                            <div className={styles["cv-ai-head"]}>
                                <span><RobotOutlined /></span>
                                <div>
                                    <h3>AI tạo CV theo job</h3>
                                    <p>
                                        {loadingJobTarget
                                            ? "Đang lấy thông tin công việc..."
                                            : jobTarget
                                                ? `${jobTarget.name}${jobTarget.company?.name ? ` - ${jobTarget.company.name}` : ""}`
                                                : "Không tìm thấy công việc"}
                                    </p>
                                </div>
                            </div>

                            <div className={styles["cv-ai-messages"]}>
                                {aiMessages.map(item => (
                                    <div
                                        key={item.id}
                                        className={`${styles["cv-ai-message"]} ${styles[`cv-ai-message-${item.role}`]}`}
                                    >
                                        {item.content}
                                    </div>
                                ))}
                            </div>

                            {jobTarget?.skills?.length ? (
                                <div className={styles["cv-ai-job-skills"]}>
                                    {jobTarget.skills.slice(0, 6).map(skill => (
                                        <Tag key={skill.id || skill.name}>{skill.name}</Tag>
                                    ))}
                                </div>
                            ) : null}

                            <TextArea
                                value={aiPrompt}
                                onChange={event => setAiPrompt(event.target.value)}
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                placeholder="Ví dụ: Em biết Vue.js, REST API, có 2 project sinh viên và muốn CV ngắn gọn cho vị trí này..."
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                loading={aiGenerating}
                                disabled={!jobTarget}
                                onClick={handleAiGenerateFromJob}
                                block
                            >
                                Tạo CV phù hợp với job
                            </Button>
                        </div>
                    )}

                    <Form layout="vertical">
                        <div className={styles["cv-editor-section"]}>
                            <div className={styles["cv-editor-section-head"]}>
                                <h3>Thông tin cá nhân</h3>
                            </div>
                            <div className={styles["cv-photo-editor"]}>
                                <div className={styles["cv-photo-preview"]}>
                                    {cv.photo ? (
                                        <img
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${cv.photo}`}
                                            alt={cv.fullName || "Ảnh CV"}
                                        />
                                    ) : (
                                        <FileTextOutlined />
                                    )}
                                </div>
                                <div>
                                    <strong>Ảnh cá nhân trong CV</strong>
                                    <span>Ảnh vuông, rõ mặt, nền gọn gàng sẽ hợp với CV hơn.</span>
                                    <Space wrap>
                                        <Upload
                                            showUploadList={false}
                                            customRequest={handleUploadPhoto}
                                            beforeUpload={beforeUploadPhoto}
                                        >
                                            <Button icon={uploadingPhoto ? <LoadingOutlined /> : <UploadOutlined />}>
                                                Tải ảnh lên
                                            </Button>
                                        </Upload>
                                        {cv.photo && (
                                            <Button onClick={() => updateField("photo", "")}>
                                                Bỏ ảnh
                                            </Button>
                                        )}
                                    </Space>
                                </div>
                            </div>
                            <Row gutter={[10, 10]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Họ tên">
                                        <Input
                                            value={cv.fullName}
                                            onChange={event => updateField("fullName", event.target.value)}
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Vị trí hiển thị">
                                        <Input
                                            value={cv.headline}
                                            onChange={event => updateField("headline", event.target.value)}
                                            placeholder="Frontend Developer"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Email">
                                        <Input
                                            value={cv.email}
                                            onChange={event => updateField("email", event.target.value)}
                                            placeholder="email@example.com"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Số điện thoại">
                                        <Input
                                            value={cv.phone}
                                            onChange={event => updateField("phone", event.target.value)}
                                            placeholder="090..."
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Địa chỉ">
                                        <Input
                                            value={cv.address}
                                            onChange={event => updateField("address", event.target.value)}
                                            placeholder="Ho Chi Minh City"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Website / GitHub">
                                        <Input
                                            value={cv.website}
                                            onChange={event => updateField("website", event.target.value)}
                                            placeholder="github.com/username"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Vị trí mong muốn">
                                        <Input
                                            value={cv.targetRole}
                                            onChange={event => updateField("targetRole", event.target.value)}
                                            placeholder="Frontend Developer, Tester, Java Developer..."
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Tóm tắt bản thân">
                                        <TextArea
                                            autoSize={{ minRows: 4, maxRows: 7 }}
                                            value={cv.summary}
                                            onChange={event => updateField("summary", event.target.value)}
                                            placeholder="Viết ngắn gọn 3-4 dòng về định hướng, kỹ năng và điểm mạnh."
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div className={styles["cv-editor-section"]}>
                            <div className={styles["cv-editor-section-head"]}>
                                <h3>Kỹ năng và mẫu CV</h3>
                            </div>
                            <Form.Item label="Kỹ năng">
                                <Select
                                    mode="tags"
                                    value={cv.skills}
                                    options={skillOptions}
                                    onChange={(value: string[]) => updateField("skills", value)}
                                    placeholder="Nhập hoặc chọn kỹ năng"
                                />
                            </Form.Item>
                            <Form.Item label="Ngoại ngữ">
                                <Input
                                    value={cv.languages}
                                    onChange={event => updateField("languages", event.target.value)}
                                    placeholder="Tiếng Việt, Tiếng Anh..."
                                />
                            </Form.Item>
                            <Form.Item label="Màu mẫu">
                                <Segmented
                                    block
                                    value={cv.theme}
                                    options={themeOptions}
                                    onChange={value => updateField("theme", value as CvTheme)}
                                />
                            </Form.Item>
                        </div>

                        {renderBasicEditor("Kinh nghiệm", "experiences")}
                        {renderBasicEditor("Học vấn", "education")}

                        <div className={styles["cv-editor-section"]}>
                            <div className={styles["cv-editor-section-head"]}>
                                <h3>Dự án</h3>
                                <Button icon={<PlusOutlined />} onClick={() => addItem("projects")}>
                                    Thêm
                                </Button>
                            </div>

                            {cv.projects.map((item, index) => (
                                <div className={styles["cv-editor-item"]} key={item.id}>
                                    <div className={styles["cv-editor-item-head"]}>
                                        <span>Dự án {index + 1}</span>
                                        {cv.projects.length > 1 && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeItem("projects", item.id)}
                                            />
                                        )}
                                    </div>
                                    <Row gutter={[10, 10]}>
                                        <Col xs={24} md={12}>
                                            <Input
                                                placeholder="Tên dự án"
                                                value={item.title}
                                                onChange={event => updateListItem("projects", item.id, "title", event.target.value)}
                                            />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Input
                                                placeholder="Vai trò"
                                                value={item.subtitle}
                                                onChange={event => updateListItem("projects", item.id, "subtitle", event.target.value)}
                                            />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Input
                                                placeholder="Thời gian"
                                                value={item.time}
                                                onChange={event => updateListItem("projects", item.id, "time", event.target.value)}
                                            />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Input
                                                placeholder="Công nghệ"
                                                value={item.technologies}
                                                onChange={event => updateListItem("projects", item.id, "technologies", event.target.value)}
                                            />
                                        </Col>
                                        <Col span={24}>
                                            <TextArea
                                                autoSize={{ minRows: 3, maxRows: 6 }}
                                                placeholder="Mỗi dòng là một ý chính..."
                                                value={item.description}
                                                onChange={event => updateListItem("projects", item.id, "description", event.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                        </div>

                        {renderBasicEditor("Chứng chỉ / hoạt động", "certificates")}

                        <Popconfirm
                            title="Tạo lại CV mới?"
                            description="Bản nháp hiện tại trong trình duyệt sẽ bị xóa."
                            okText="Tạo lại"
                            cancelText="Hủy"
                            onConfirm={handleClearDraft}
                        >
                            <Button danger block>
                                Tạo lại CV mới
                            </Button>
                        </Popconfirm>
                    </Form>
                </aside>

                <main className={styles["cv-preview-panel"]}>
                    <div className={styles["cv-preview-toolbar"]}>
                        <div>
                            <strong>Bản xem trước</strong>
                            <span>Khổ A4, có thể in hoặc lưu PDF.</span>
                        </div>
                        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                            Xuất PDF
                        </Button>
                    </div>

                    <div className={styles["cv-paper-wrap"]}>
                        <article
                            ref={printRef}
                            className={`${styles["cv-paper"]} ${styles[`cv-theme-${cv.theme}`]} ${styles["cv-print-area"]}`}
                        >
                            <header className={styles["cv-paper-header"]}>
                                <div>
                                    <h2>{cv.fullName || "Tên của bạn"}</h2>
                                    <p>{cv.headline || cv.targetRole || "Vị trí ứng tuyển"}</p>
                                </div>
                                {cv.photo && (
                                    <div className={styles["cv-paper-photo"]}>
                                        <img
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${cv.photo}`}
                                            alt={cv.fullName || "Ảnh CV"}
                                        />
                                    </div>
                                )}
                                <ul>
                                    {cv.email && <li>{cv.email}</li>}
                                    {cv.phone && <li>{cv.phone}</li>}
                                    {cv.address && <li>{cv.address}</li>}
                                    {cv.website && <li>{cv.website}</li>}
                                </ul>
                            </header>

                            {cv.summary && (
                                <section className={styles["cv-paper-section"]}>
                                    <h3>Tóm tắt</h3>
                                    <p>{cv.summary}</p>
                                </section>
                            )}

                            <section className={styles["cv-paper-grid"]}>
                                <div>
                                    {visibleExperiences.length > 0 && (
                                        <section className={styles["cv-paper-section"]}>
                                            <h3>Kinh nghiệm</h3>
                                            {visibleExperiences.map(item => (
                                                <div className={styles["cv-paper-item"]} key={item.id}>
                                                    <div className={styles["cv-paper-item-head"]}>
                                                        <strong>{item.title}</strong>
                                                        <span>{item.time}</span>
                                                    </div>
                                                    {item.subtitle && <em>{item.subtitle}</em>}
                                                    <ul>
                                                        {splitLines(item.description).map(line => <li key={line}>{line}</li>)}
                                                    </ul>
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {visibleProjects.length > 0 && (
                                        <section className={styles["cv-paper-section"]}>
                                            <h3>Dự án</h3>
                                            {visibleProjects.map(item => (
                                                <div className={styles["cv-paper-item"]} key={item.id}>
                                                    <div className={styles["cv-paper-item-head"]}>
                                                        <strong>{item.title}</strong>
                                                        <span>{item.time}</span>
                                                    </div>
                                                    {item.subtitle && <em>{item.subtitle}</em>}
                                                    {item.technologies && <small>{item.technologies}</small>}
                                                    <ul>
                                                        {splitLines(item.description).map(line => <li key={line}>{line}</li>)}
                                                    </ul>
                                                </div>
                                            ))}
                                        </section>
                                    )}
                                </div>

                                <aside>
                                    {cv.skills.length > 0 && (
                                        <section className={styles["cv-paper-section"]}>
                                            <h3>Kỹ năng</h3>
                                            <div className={styles["cv-paper-tags"]}>
                                                {cv.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                                            </div>
                                        </section>
                                    )}

                                    {visibleEducation.length > 0 && (
                                        <section className={styles["cv-paper-section"]}>
                                            <h3>Học vấn</h3>
                                            {visibleEducation.map(item => (
                                                <div className={styles["cv-paper-item"]} key={item.id}>
                                                    <strong>{item.title}</strong>
                                                    {item.subtitle && <em>{item.subtitle}</em>}
                                                    {item.time && <span>{item.time}</span>}
                                                    {splitLines(item.description).map(line => <p key={line}>{line}</p>)}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {cv.languages && (
                                        <section className={styles["cv-paper-section"]}>
                                            <h3>Ngoại ngữ</h3>
                                            <p>{cv.languages}</p>
                                        </section>
                                    )}

                                    {visibleCertificates.length > 0 && (
                                        <section className={styles["cv-paper-section"]}>
                                            <h3>Chứng chỉ</h3>
                                            {visibleCertificates.map(item => (
                                                <div className={styles["cv-paper-item"]} key={item.id}>
                                                    <strong>{item.title}</strong>
                                                    {item.subtitle && <em>{item.subtitle}</em>}
                                                    {item.time && <span>{item.time}</span>}
                                                    {splitLines(item.description).map(line => <p key={line}>{line}</p>)}
                                                </div>
                                            ))}
                                        </section>
                                    )}
                                </aside>
                            </section>

                            <Divider />
                            <p className={styles["cv-paper-note"]}>
                                CV được tạo từ IT Career. Bạn có thể chỉnh nội dung trước khi ứng tuyển.
                            </p>
                        </article>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CvBuilderPage;
