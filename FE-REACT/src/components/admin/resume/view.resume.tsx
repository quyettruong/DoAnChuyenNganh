import React, { useEffect, useState } from "react";
import {
    Modal,
    Descriptions,
    Tag,
    Button,
    Typography,
    message,
    Select,
    Progress,
    Space,
} from "antd";
import dayjs from "dayjs";
import { IResume } from "@/types/backend";
import {
    callEvaluateResume,
    callSummarizeResume,
    callUpdateResumeStatus,
} from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";

const { Paragraph, Text } = Typography;

const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === "object") {
        const apiError = error as {
            message?: string | string[];
            response?: { data?: { message?: string | string[] } };
        };
        const message = apiError.response?.data?.message ?? apiError.message;

        if (Array.isArray(message)) return message.join(", ");
        if (typeof message === "string" && message.trim()) return message;
    }

    return fallback;
};

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IResume | null;
    setDataInit: (v: IResume | null) => void;
    reloadTable: () => void;
}

const statusColor: Record<string, string> = {
    PENDING: "default",
    REVIEWING: "processing",
    APPROVED: "success",
    REJECTED: "error",
    FULL: "warning",
};

const recommendationText: Record<string, string> = {
    APPROVED: "Nên ưu tiên",
    REVIEWING: "Cần xem xét thêm",
    REJECTED: "Chưa phù hợp",
};

const ViewDetailResume: React.FC<IProps> = (props) => {
    const { open, onClose, dataInit, reloadTable, setDataInit } = props;

    const [summaryLoading, setSummaryLoading] = useState(false);
    const [evaluationLoading, setEvaluationLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<string | undefined>(
        dataInit?.status,
    );

    // mỗi lần mở 1 CV khác thì sync lại trạng thái
    useEffect(() => {
        setCurrentStatus(dataInit?.status);
    }, [dataInit]);

    // ====== TỰ ĐỘNG TÓM TẮT CV KHI MỞ MODAL ======
    useEffect(() => {
        if (
            open &&
            dataInit?.id &&
            !dataInit.summaryAi &&
            !summaryLoading
        ) {
            handleSummarize();
        }
    }, [open, dataInit?.id]);

    // Sau khi đã có tóm tắt, tự đánh giá nếu CV chưa có điểm phù hợp.
    useEffect(() => {
        if (
            open &&
            dataInit?.id &&
            dataInit.summaryAi &&
            typeof dataInit.aiMatchScore !== "number" &&
            !evaluationLoading
        ) {
            handleEvaluate();
        }
    }, [open, dataInit?.id, dataInit?.summaryAi, dataInit?.aiMatchScore]);


    const handleClose = () => {
        onClose(false);
    };

    // ====== GỌI AI TÓM TẮT CV ======
    const handleSummarize = async () => {
        if (!dataInit?.id) {
            message.error("Resume không hợp lệ");
            return;
        }

        try {
            setSummaryLoading(true);

            // res = { statusCode, message, data: { resumeId, summaryAi } }
            const res = await callSummarizeResume(dataInit.id);

            if (res?.statusCode === 200) {
                message.success("Tóm tắt CV thành công");

                // cập nhật ngay nội dung đang mở modal (không cần đóng/mở lại)
                props.setDataInit({
                    ...dataInit,
                    summaryAi: res?.data?.summaryAi,
                });

                reloadTable();
            } else {
                message.error(res?.message || "Không thể tóm tắt CV");
            }
        } catch (e) {
            message.error(getApiErrorMessage(e, "Lỗi khi tóm tắt CV"));
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (!dataInit?.id) {
            message.error("Resume không hợp lệ");
            return;
        }

        try {
            setEvaluationLoading(true);

            const res = await callEvaluateResume(dataInit.id);

            if (res?.statusCode === 200) {
                message.success("AI đã đánh giá CV thành công");
                props.setDataInit({
                    ...dataInit,
                    ...res.data,
                });
                reloadTable();
            } else {
                message.error(res?.message || "Không thể đánh giá CV bằng AI");
            }
        } catch (e) {
            message.error(getApiErrorMessage(e, "Lỗi khi đánh giá CV bằng AI"));
        } finally {
            setEvaluationLoading(false);
        }
    };


    const handleUpdateStatus = async () => {
        if (!dataInit?.id) {
            message.error("Resume không hợp lệ");
            return;
        }

        if (!currentStatus) {
            message.error("Vui lòng chọn trạng thái");
            return;
        }

        if (currentStatus === dataInit.status) {
            handleClose();
            return;
        }

        try {
            setStatusLoading(true);

            // gửi body { id, status } đúng với BE
            const res = await callUpdateResumeStatus({
                id: dataInit.id,
                status: currentStatus,
            });

            // res = { statusCode, message, data }
            if (res?.statusCode === 200) {
                message.success(res.message || "Cập nhật trạng thái thành công");
                reloadTable();
                onClose(false);
            } else {
                message.error(res?.message || "Không thể cập nhật trạng thái");
            }
        } catch (e) {
            message.error("Không thể cập nhật trạng thái");
        } finally {
            setStatusLoading(false);
        }
    };

    const normalizeList = (value?: string[] | string) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        return value
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const renderTagList = (items: string[] | undefined, color: string, emptyText: string) => {
        const list = normalizeList(items);
        if (!list.length) return <Text type="secondary">{emptyText}</Text>;
        return (
            <Space size={[6, 6]} wrap>
                {list.map((item) => (
                    <Tag key={item} color={color}>
                        {item}
                    </Tag>
                ))}
            </Space>
        );
    };

    const renderBulletList = (items: string[] | string | undefined, emptyText: string) => {
        const list = normalizeList(items);
        if (!list.length) return <Text type="secondary">{emptyText}</Text>;
        return (
            <ul className="ai-evaluation-list">
                {list.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        );
    };

    const score = dataInit?.aiMatchScore;
    const hasEvaluation = typeof score === "number";




    return (
        <Modal
            open={open}
            title={
                dataInit ? `Thông tin Resume #${dataInit.id}` : "Thông tin Resume"
            }
            onCancel={handleClose}
            footer={[
                <Access
                    key="evaluate"
                    permission={ALL_PERMISSIONS.RESUMES.AI_EVALUATE}
                    hideChildren
                >
                    <Button
                        type="primary"
                        loading={evaluationLoading}
                        onClick={handleEvaluate}
                    >
                        AI đánh giá CV
                    </Button>
                </Access>,

                // nút AI summary: chỉ ẩn nút khi không đủ quyền, KHÔNG render 403
                <Access
                    key="ai"
                    permission={ALL_PERMISSIONS.RESUMES.AI_SUMMARY}
                    hideChildren
                >
                    <Button
                        loading={summaryLoading}
                        onClick={handleSummarize}
                    >
                        Tóm tắt CV bằng AI
                    </Button>
                </Access>,

                // nút Lưu trạng thái: cũng chỉ ẩn nút
                <Access
                    key="update"
                    permission={ALL_PERMISSIONS.RESUMES.UPDATE}
                    hideChildren
                >
                    <Button
                        type="primary"
                        ghost
                        loading={statusLoading}
                        onClick={handleUpdateStatus}
                    >
                        Lưu trạng thái
                    </Button>
                </Access>,

                <Button key="close" onClick={handleClose}>
                    Đóng
                </Button>,
            ]}
            destroyOnClose
            width={900}
        >
            {dataInit && (
                <Descriptions column={2} bordered>
                    <Descriptions.Item label="Id">
                        {dataInit.id}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <Select
                            style={{ minWidth: 160 }}
                            value={currentStatus}
                            onChange={setCurrentStatus}
                            options={[
                                { value: "PENDING", label: "PENDING" },
                                { value: "REVIEWING", label: "REVIEWING" },
                                { value: "APPROVED", label: "APPROVED" },
                                { value: "REJECTED", label: "REJECTED" },
                                { value: "FULL", label: "FULL" },
                            ]}
                        />
                        {currentStatus && (
                            <Tag
                                color={statusColor[currentStatus]}
                                style={{ marginLeft: 8 }}
                            >
                                {currentStatus}
                            </Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Thông báo" span={2}>
                        {dataInit.statusNote || "Chưa có thông báo trạng thái."}
                    </Descriptions.Item>

                    <Descriptions.Item label="Email">
                        {dataInit.email}
                    </Descriptions.Item>

                    <Descriptions.Item label="File CV">
                        {dataInit.url}
                    </Descriptions.Item>

                    <Descriptions.Item label="Job">
                        {dataInit.job?.name}
                    </Descriptions.Item>

                    <Descriptions.Item label="Company">
                        {dataInit.companyName || dataInit.job?.company?.name}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt
                            ? dayjs(dataInit.createdAt).format(
                                "DD-MM-YYYY HH:mm:ss",
                            )
                            : ""}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày sửa">
                        {dataInit.updatedAt
                            ? dayjs(dataInit.updatedAt).format(
                                "DD-MM-YYYY HH:mm:ss",
                            )
                            : ""}
                    </Descriptions.Item>

                    <Descriptions.Item label="Đánh giá phù hợp (AI)" span={2}>
                        {hasEvaluation ? (
                            <div className="ai-evaluation-panel">
                                <div className="ai-evaluation-head">
                                    <Progress
                                        type="circle"
                                        size={76}
                                        percent={score ?? 0}
                                        strokeColor={
                                            (score ?? 0) >= 80
                                                ? "#16a34a"
                                                : (score ?? 0) >= 55
                                                    ? "#2563eb"
                                                    : "#dc2626"
                                        }
                                    />
                                    <div className="ai-evaluation-summary">
                                        <Space size={[8, 8]} wrap>
                                            <Tag color={statusColor[dataInit.aiRecommendation || ""] || "default"}>
                                                {recommendationText[dataInit.aiRecommendation || ""] ||
                                                    dataInit.aiRecommendation ||
                                                    "Chưa có gợi ý"}
                                            </Tag>
                                            {dataInit.aiEvaluatedAt && (
                                                <Text type="secondary">
                                                    {dayjs(dataInit.aiEvaluatedAt).format("DD-MM-YYYY HH:mm:ss")}
                                                </Text>
                                            )}
                                        </Space>
                                        <Paragraph>
                                            {dataInit.aiEvaluation || "AI chưa có nhận xét chi tiết."}
                                        </Paragraph>
                                    </div>
                                </div>

                                <div className="ai-evaluation-grid">
                                    <div>
                                        <Text strong>Kỹ năng khớp</Text>
                                        <div className="ai-evaluation-body">
                                            {renderTagList(dataInit.aiMatchedSkills, "green", "Chưa phát hiện kỹ năng khớp.")}
                                        </div>
                                    </div>
                                    <div>
                                        <Text strong>Kỹ năng thiếu</Text>
                                        <div className="ai-evaluation-body">
                                            {renderTagList(dataInit.aiMissingSkills, "orange", "Chưa phát hiện thiếu sót lớn.")}
                                        </div>
                                    </div>
                                    <div>
                                        <Text strong>Điểm mạnh</Text>
                                        {renderBulletList(dataInit.aiStrengths, "Chưa có điểm mạnh nổi bật.")}
                                    </div>
                                    <div>
                                        <Text strong>Điểm cần xem lại</Text>
                                        {renderBulletList(dataInit.aiWeaknesses, "Chưa có điểm cần xem lại.")}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary">
                                Chưa có đánh giá. Bấm nút "AI đánh giá CV" để so CV với yêu cầu công việc.
                            </Text>
                        )}
                    </Descriptions.Item>

                    {/* TÓM TẮT CV BẰNG AI */}
                    <Descriptions.Item label="Tóm tắt CV (AI)" span={2}>
                        {dataInit.summaryAi ? (
                            <Paragraph
                                style={{
                                    whiteSpace: "pre-line",
                                    marginBottom: 0,
                                }}
                            >
                                {dataInit.summaryAi}
                            </Paragraph>
                        ) : (
                            <Text type="secondary">
                                Chưa có tóm tắt. Bấm nút "Tóm tắt CV bằng AI" để
                                tạo.
                            </Text>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Modal>
    );
};

export default ViewDetailResume;
