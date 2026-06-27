import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Spin, Tag } from "antd";
import {
    CloseOutlined,
    CustomerServiceOutlined,
    RobotOutlined,
    SendOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { callFetchJobById, callSupportChat } from "@/config/api";
import { IJob } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import styles from "@/styles/client.module.scss";

const { TextArea } = Input;

type ChatRole = "assistant" | "user";

interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
}

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const baseSuggestions = [
    "Cách tạo CV",
    "Cách nộp CV",
    "Tìm việc phù hợp",
    "Xem trạng thái hồ sơ",
];

const FloatingSupportChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentJob, setCurrentJob] = useState<IJob | null>(null);
    const [replySuggestions, setReplySuggestions] = useState<string[]>([]);
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: createId(),
            role: "assistant",
            content: "Xin chào, mình là trợ lý IT Career. Bạn có thể hỏi về tìm việc, tạo CV, nộp CV, trạng thái hồ sơ hoặc bản đồ việc làm.",
        },
    ]);

    const jobId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        if (!location.pathname.startsWith("/job/")) return null;
        return params.get("id");
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (!jobId) {
            setCurrentJob(null);
            return;
        }

        let mounted = true;
        callFetchJobById(jobId)
            .then(res => {
                if (mounted) setCurrentJob(res?.data || null);
            })
            .catch(() => {
                if (mounted) setCurrentJob(null);
            });

        return () => {
            mounted = false;
        };
    }, [jobId]);

    const suggestions = replySuggestions.length
        ? replySuggestions
        : currentJob
            ? ["Tạo CV cho job này", ...baseSuggestions]
            : baseSuggestions;

    useEffect(() => {
        const messageBox = messagesRef.current;
        if (!messageBox) return;

        requestAnimationFrame(() => {
            messageBox.scrollTo({
                top: messageBox.scrollHeight,
                behavior: "smooth",
            });
        });
    }, [messages, loading]);

    const appendMessage = (role: ChatRole, content: string) => {
        setMessages(previous => [...previous, { id: createId(), role, content }]);
    };

    const handleAction = (action?: { type?: string; jobId?: string | number }) => {
        if (action?.type === "OPEN_CV_BUILDER" && action.jobId) {
            navigate(`/cv-builder?jobId=${action.jobId}`);
            setOpen(false);
        }
    };

    const sendMessage = async (content: string) => {
        const message = content.trim();
        if (!message || loading) return;

        const chatHistory = [
            ...messages.slice(-6).map(item => ({
                role: item.role,
                content: item.content,
            })),
            { role: "user", content: message },
        ];

        appendMessage("user", message);
        setInput("");
        setLoading(true);

        try {
            const res = await callSupportChat({
                message,
                path: location.pathname,
                search: location.search,
                authenticated: isAuthenticated,
                chatHistory,
                jobContext: currentJob
                    ? {
                        id: currentJob.id,
                        name: currentJob.name,
                        companyName: currentJob.company?.name,
                        level: currentJob.level,
                        skills: currentJob.skills?.map(item => item.name),
                    }
                    : null,
            });

            if (res?.statusCode === 200 && res.data?.reply) {
                appendMessage("assistant", res.data.reply);
                setReplySuggestions(Array.isArray(res.data.suggestions) ? res.data.suggestions : []);
                handleAction(res.data.action);
                return;
            }

            appendMessage("assistant", res?.message || "Mình chưa phản hồi được lúc này. Bạn thử hỏi lại ngắn gọn hơn nhé.");
        } catch (error) {
            appendMessage("assistant", "Mình chưa kết nối được trợ lý AI lúc này. Bạn kiểm tra lại AI service hoặc thử lại sau nhé.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={`${styles["support-chat-float"]} ${open ? styles["support-chat-float-open"] : ""}`}>
                <div className={styles["support-chat-hint"]}>
                    {open ? "Đóng hỗ trợ" : "Trợ lý hỗ trợ"}
                </div>
                <button
                    type="button"
                    className={`${styles["support-chat-button"]} ${open ? styles["support-chat-button-open"] : ""}`}
                    aria-label="Mở chat hỗ trợ"
                    aria-expanded={open}
                    onClick={() => setOpen(prev => !prev)}
                >
                    {open ? <CloseOutlined /> : <CustomerServiceOutlined />}
                </button>
            </div>

            {open && (
                <section className={styles["support-chat-panel"]}>
                    <header className={styles["support-chat-header"]}>
                        <span><RobotOutlined /></span>
                        <div>
                            <h3>Trợ lý IT Career</h3>
                            <p>Hỏi nhanh về tìm việc, CV và ứng tuyển</p>
                        </div>
                    </header>

                    <div
                        ref={messagesRef}
                        className={styles["support-chat-messages"]}
                        aria-live="polite"
                    >
                        {messages.map(item => (
                            <div
                                key={item.id}
                                className={`${styles["support-chat-message"]} ${styles[`support-chat-message-${item.role}`]}`}
                            >
                                {item.content}
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles["support-chat-message"]} ${styles["support-chat-message-assistant"]} ${styles["support-chat-typing"]}`}>
                                <Spin size="small" />
                                <span>Đang trả lời</span>
                                <i />
                                <i />
                                <i />
                            </div>
                        )}
                    </div>

                    <div className={styles["support-chat-suggestions"]}>
                        {suggestions.map(item => (
                            <Tag key={item} onClick={() => sendMessage(item)}>
                                {item}
                            </Tag>
                        ))}
                    </div>

                    <div className={styles["support-chat-input"]}>
                        <TextArea
                            value={input}
                            onChange={event => setInput(event.target.value)}
                            onPressEnter={event => {
                                if (!event.shiftKey) {
                                    event.preventDefault();
                                    sendMessage(input);
                                }
                            }}
                            autoSize={{ minRows: 2, maxRows: 4 }}
                            placeholder="Nhập câu hỏi của bạn..."
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            loading={loading}
                            onClick={() => sendMessage(input)}
                        />
                    </div>
                </section>
            )}
        </>
    );
};

export default FloatingSupportChat;
