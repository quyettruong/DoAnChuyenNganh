import { useEffect, useState } from "react";
import { App as AntdApp, Button, Empty, Popconfirm, Space, Spin, Tag } from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    FileTextOutlined,
    PlusOutlined,
    StarFilled,
    StarOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import {
    callDeleteUserCv,
    callFetchUserCvs,
    callSetDefaultUserCv,
} from "@/config/api";
import { IUserCv } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import styles from "styles/client.module.scss";

const formatDate = (value?: string) => {
    if (!value) return "Chưa cập nhật";
    return new Date(value).toLocaleString("vi-VN");
};

const getThemeLabel = (theme?: string) => {
    if (theme === "blue") return "Xanh dương";
    if (theme === "slate") return "Tối giản";
    return "Xanh lá";
};

const MyCvPage = () => {
    const { message } = AntdApp.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const isAccountLoading = useAppSelector(state => state.account.isLoading);
    const [loading, setLoading] = useState(false);
    const [cvs, setCvs] = useState<IUserCv[]>([]);

    const loadCvs = async () => {
        setLoading(true);
        const res = await callFetchUserCvs("page=1&size=20");
        setLoading(false);

        if (res?.data?.result) {
            setCvs(res.data.result);
            return;
        }

        message.error(res?.message || "Không thể tải danh sách CV");
    };

    useEffect(() => {
        if (isAccountLoading) return;

        if (!isAuthenticated) {
            const callback = `${location.pathname}${location.search}`;
            navigate(`/login?callback=${encodeURIComponent(callback)}`);
            return;
        }

        loadCvs();
    }, [isAccountLoading, isAuthenticated]);

    const handleDelete = async (id?: string) => {
        if (!id) return;
        const res = await callDeleteUserCv(id);

        if (+res.statusCode === 200) {
            message.success("Đã xóa CV");
            loadCvs();
            return;
        }

        message.error(res?.message || "Không thể xóa CV");
    };

    const handleSetDefault = async (id?: string) => {
        if (!id) return;
        const res = await callSetDefaultUserCv(id);

        if (res?.data?.id) {
            message.success("Đã đặt CV mặc định");
            loadCvs();
            return;
        }

        message.error(res?.message || "Không thể đặt CV mặc định");
    };

    return (
        <div className={`${styles["container"]} ${styles["my-cv-page"]}`}>
            <section className={styles["my-cv-hero"]}>
                <div>
                    <span className={styles["hero-eyebrow"]}>My CV</span>
                    <h1>Quản lý CV cá nhân</h1>
                    <p>Xem lại các CV đã lưu, chỉnh sửa nội dung và chọn CV mặc định để dùng khi ứng tuyển.</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/cv-builder")}>
                    Tạo CV mới
                </Button>
            </section>

            <Spin spinning={loading}>
                {cvs.length ? (
                    <div className={styles["my-cv-list"]}>
                        {cvs.map(cv => (
                            <article className={styles["my-cv-card"]} key={cv.id}>
                                <div className={styles["my-cv-icon"]}>
                                    <FileTextOutlined />
                                </div>

                                <div className={styles["my-cv-content"]}>
                                    <div className={styles["my-cv-title-row"]}>
                                        <h2>{cv.title}</h2>
                                        {cv.defaultCv && (
                                            <Tag color="green" icon={<StarFilled />}>
                                                Mặc định
                                            </Tag>
                                        )}
                                    </div>
                                    <div className={styles["my-cv-meta"]}>
                                        <span>Mẫu: {cv.templateCode || "itcareer-basic"}</span>
                                        <span>Màu: {getThemeLabel(cv.theme)}</span>
                                        <span>Cập nhật: {formatDate(cv.updatedAt || cv.createdAt)}</span>
                                    </div>
                                </div>

                                <Space wrap className={styles["my-cv-actions"]}>
                                    <Button
                                        icon={<EditOutlined />}
                                        onClick={() => navigate(`/cv-builder?id=${cv.id}`)}
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        icon={cv.defaultCv ? <StarFilled /> : <StarOutlined />}
                                        disabled={cv.defaultCv}
                                        onClick={() => handleSetDefault(cv.id)}
                                    >
                                        Đặt mặc định
                                    </Button>
                                    <Popconfirm
                                        title="Xóa CV này?"
                                        description="CV đã xóa sẽ không thể khôi phục."
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        onConfirm={() => handleDelete(cv.id)}
                                    >
                                        <Button danger icon={<DeleteOutlined />}>
                                            Xóa
                                        </Button>
                                    </Popconfirm>
                                </Space>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className={styles["my-cv-empty"]}>
                        <Empty
                            description="Bạn chưa lưu CV nào"
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/cv-builder")}>
                            Tạo CV đầu tiên
                        </Button>
                    </div>
                )}
            </Spin>
        </div>
    );
};

export default MyCvPage;
