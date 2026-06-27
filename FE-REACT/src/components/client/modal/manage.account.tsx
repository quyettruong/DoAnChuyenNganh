import {
    Button,
    Col,
    Form,
    Modal,
    Row,
    Table,
    Tabs,
    Avatar,
    Upload,
    message,
    Input,
    Tag,
} from "antd";
import { isMobile } from "react-device-detect";
import type { TabsProps } from "antd";
import { IResume } from "@/types/backend";
import { useState, useEffect } from "react";
import {
    callFetchResumeByUser,
    callUpdateProfile,
    callChangePassword,
    callUploadSingleFile,
} from "@/config/api";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { fetchAccount } from "@/redux/slice/accountSlide";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import styles from "@/styles/client.module.scss";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    defaultActiveKey?: string;
}

const resumeStatusColor: Record<string, string> = {
    PENDING: "default",
    REVIEWING: "processing",
    APPROVED: "success",
    REJECTED: "error",
    FULL: "warning",
};

const resumeStatusText: Record<string, string> = {
    PENDING: "Đang chờ duyệt",
    REVIEWING: "Đang xem xét",
    APPROVED: "Được chấp thuận",
    REJECTED: "Chưa phù hợp",
    FULL: "Đã đủ số lượng",
};

/**
 * TAB 1: Danh sách CV đã rải
 */
const UserResume = (props: any) => {
    const [listCV, setListCV] = useState<IResume[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(false);

    useEffect(() => {
        const init = async () => {
            setIsFetching(true);
            const res = await callFetchResumeByUser();
            if (res && res.data) {
                setListCV(res.data.result as IResume[]);
            }
            setIsFetching(false);
        };
        init();
    }, []);

    const columns: ColumnsType<IResume> = [
        {
            title: "STT",
            key: "index",
            width: 50,
            align: "center",
            render: (text, record, index) => {
                return <>{index + 1}</>;
            },
        },
        {
            title: "Công Ty",
            dataIndex: "companyName",
        },
        {
            title: "Job title",
            dataIndex: ["job", "name"],
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render(value, record) {
                return (
                    <div>
                        <Tag color={resumeStatusColor[record.status] || "default"}>
                            {resumeStatusText[record.status] || record.status}
                        </Tag>
                        {record.statusNote && (
                            <div style={{ marginTop: 6, color: "#667085", lineHeight: 1.45 }}>
                                {record.statusNote}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Ngày rải CV",
            dataIndex: "createdAt",
            render(value, record, index) {
                return <>{dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")}</>;
            },
        },
        {
            title: "",
            dataIndex: "",
            render(value, record, index) {
                return (
                    <a
                        href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${record?.url
                            }`}
                        target="_blank"
                    >
                        Chi tiết
                    </a>
                );
            },
        },
    ];

    return (
        <div>
            <Table<IResume>
                columns={columns}
                dataSource={listCV}
                loading={isFetching}
                pagination={false}
            />
        </div>
    );
};

/**
 * TAB 2: Cập nhật thông tin user hiện tại
 */
const UserUpdateInfo = (props: any) => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.account.user);
    const [loading, setLoading] = useState(false);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const avatar = Form.useWatch("avatar", form);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            });
        }
    }, [user, form]);

    const beforeUploadAvatar = (file: any) => {
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

    const handleUploadAvatar = async ({ file, onSuccess, onError }: any) => {
        setLoadingUpload(true);
        const res = await callUploadSingleFile(file, "avatar");
        setLoadingUpload(false);

        if (res?.data?.fileName) {
            form.setFieldValue("avatar", res.data.fileName);
            message.success("Tải ảnh đại diện thành công");
            onSuccess?.("ok");
            return;
        }

        const error = new Error(res?.message || "Upload ảnh thất bại");
        onError?.({ event: error });
        message.error(error.message);
    };


    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const res = await callUpdateProfile(
                values.name,
                values.address,
                values.age,
                values.avatar
            );
            if (res?.statusCode === 200) {
                dispatch(fetchAccount());
                message.success("Cập nhật thông tin thành công");
            } else {
                message.error(res?.message || "Có lỗi xảy ra");
            }
        } catch (e: any) {
            message.error("Có lỗi xảy ra khi cập nhật thông tin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <div className={styles["account-avatar-editor"]}>
                <Avatar
                    size={84}
                    src={avatar ? `${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${avatar}` : undefined}
                >
                    {user?.name?.substring(0, 2)?.toUpperCase()}
                </Avatar>
                <div>
                    <strong>Ảnh đại diện</strong>
                    <span>Ảnh này sẽ hiển thị trên thanh tài khoản.</span>
                    <div>
                        <Upload
                            showUploadList={false}
                            customRequest={handleUploadAvatar}
                            beforeUpload={beforeUploadAvatar}
                        >
                            <Button icon={loadingUpload ? <LoadingOutlined /> : <UploadOutlined />}>
                                Tải ảnh lên
                            </Button>
                        </Upload>
                        {avatar && (
                            <Button style={{ marginLeft: 8 }} onClick={() => form.setFieldValue("avatar", "")}>
                                Bỏ ảnh
                            </Button>
                        )}
                    </div>
                </div>
                <Form.Item name="avatar" hidden>
                    <Input />
                </Form.Item>
            </div>
            <Row gutter={[20, 20]}>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Họ tên"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                    >
                        <Input placeholder="Nhập họ tên" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Địa chỉ" name="address">
                        <Input placeholder="Nhập địa chỉ" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Tuổi" name="age">
                        <Input type="number" placeholder="Nhập tuổi" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Lưu thay đổi
                    </Button>
                </Col>
            </Row>
        </Form>
    );
};



/**
 * TAB 4: Đổi mật khẩu khi đã đăng nhập
 */
const UserChangePassword = (props: any) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error("Mật khẩu mới và xác nhận không khớp");
            return;
        }

        try {
            setLoading(true);
            const res = await callChangePassword(
                values.currentPassword,
                values.newPassword
            );
            if (res?.statusCode === 200) {
                message.success("Đổi mật khẩu thành công");
                form.resetFields();
            } else {
                message.error(res?.message || "Có lỗi xảy ra");
            }
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Có lỗi xảy ra khi đổi mật khẩu";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <Row gutter={[20, 20]}>
                <Col span={24}>
                    <Form.Item
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới" },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        dependencies={["newPassword"]}
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("newPassword") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Mật khẩu mới và xác nhận không khớp")
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Đổi mật khẩu
                    </Button>
                </Col>
            </Row>
        </Form>
    );
};

/**
 * Modal chính
 */
const ManageAccount = (props: IProps) => {
    const { open, onClose, defaultActiveKey = "user-resume" } = props;
    const [activeKey, setActiveKey] = useState(defaultActiveKey);

    const onChange = (key: string) => {
        setActiveKey(key);
    };

    useEffect(() => {
        if (open) {
            setActiveKey(defaultActiveKey);
        }
    }, [defaultActiveKey, open]);

    const items: TabsProps["items"] = [
        {
            key: "user-resume",
            label: `Rải CV`,
            children: <UserResume />,
        },
        {
            key: "user-update-info",
            label: `Cập nhật thông tin`,
            children: <UserUpdateInfo />,
        },
        {
            key: "user-password",
            label: `Thay đổi mật khẩu`,
            children: <UserChangePassword />,
        },
    ];

    return (
        <>
            <Modal
                title="Quản lý tài khoản"
                open={open}
                onCancel={() => onClose(false)}
                maskClosable={false}
                footer={null}
                destroyOnClose={true}
                width={isMobile ? "100%" : "1000px"}
            >
                <div style={{ minHeight: 400 }}>
                    <Tabs activeKey={activeKey} items={items} onChange={onChange} />
                </div>
            </Modal>
        </>
    );
};

export default ManageAccount;
