import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Empty, Popover, Spin, Tooltip } from "antd";
import { BellOutlined, CheckOutlined, FileSearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
    callCountUnreadNotifications,
    callFetchNotifications,
    callMarkAllNotificationsAsRead,
    callMarkNotificationAsRead,
} from "@/config/api";
import { useAppSelector } from "@/redux/hooks";
import { INotification } from "@/types/backend";
import styles from "@/styles/client.module.scss";

dayjs.extend(relativeTime);

interface IProps {
    onOpenResumeApplications: () => void;
}

const NotificationBell = ({ onOpenResumeApplications }: IProps) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<INotification[]>([]);

    const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

    const loadNotifications = useCallback(async () => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setLoading(true);
        const [listRes, countRes] = await Promise.all([
            callFetchNotifications("page=1&size=8"),
            callCountUnreadNotifications(),
        ]);

        if (listRes?.data?.result) {
            setNotifications(listRes.data.result);
        }

        if (countRes?.data) {
            setUnreadCount(Number(countRes.data.count || 0));
        }

        setLoading(false);
    }, [isAuthenticated]);

    useEffect(() => {
        loadNotifications();

        if (!isAuthenticated) return;

        const timer = window.setInterval(() => {
            loadNotifications();
        }, 45000);

        return () => window.clearInterval(timer);
    }, [isAuthenticated, loadNotifications]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            loadNotifications();
        }
    };

    const handleNotificationClick = async (notification: INotification) => {
        if (!notification.read) {
            await callMarkNotificationAsRead(notification.id);
            setNotifications(previous =>
                previous.map(item =>
                    item.id === notification.id ? { ...item, read: true, readAt: new Date().toISOString() } : item,
                ),
            );
            setUnreadCount(previous => Math.max(previous - 1, 0));
        }

        setOpen(false);

        if (notification.targetType === "RESUME") {
            onOpenResumeApplications();
        }
    };

    const handleReadAll = async () => {
        await callMarkAllNotificationsAsRead();
        setNotifications(previous =>
            previous.map(item => ({ ...item, read: true, readAt: item.readAt || new Date().toISOString() })),
        );
        setUnreadCount(0);
    };

    const content = (
        <div className={styles["notification-panel"]}>
            <div className={styles["notification-head"]}>
                <div>
                    <strong>Thông báo</strong>
                    <span>{hasUnread ? `${unreadCount} thông báo mới` : "Không có thông báo mới"}</span>
                </div>
                {hasUnread && (
                    <button type="button" onClick={handleReadAll}>
                        <CheckOutlined /> Đã đọc
                    </button>
                )}
            </div>

            <div className={styles["notification-list"]}>
                {loading ? (
                    <div className={styles["notification-loading"]}>
                        <Spin size="small" />
                    </div>
                ) : notifications.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
                ) : (
                    notifications.map(item => (
                        <button
                            type="button"
                            key={item.id}
                            className={`${styles["notification-item"]} ${!item.read ? styles["notification-item-unread"] : ""}`}
                            onClick={() => handleNotificationClick(item)}
                        >
                            <span className={styles["notification-icon"]}>
                                <FileSearchOutlined />
                            </span>
                            <span className={styles["notification-body"]}>
                                <span className={styles["notification-title"]}>{item.title}</span>
                                <span className={styles["notification-message"]}>{item.message}</span>
                                {item.createdAt && (
                                    <span className={styles["notification-time"]}>
                                        {dayjs(item.createdAt).fromNow()}
                                    </span>
                                )}
                            </span>
                            {!item.read && <span className={styles["notification-dot"]} />}
                        </button>
                    ))
                )}
            </div>
        </div>
    );

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Popover
            open={open}
            onOpenChange={handleOpenChange}
            trigger="click"
            placement="bottomRight"
            content={content}
            arrow={false}
            overlayClassName={styles["notification-popover"]}
        >
            <Tooltip title="Thông báo hồ sơ ứng tuyển">
                <button type="button" className={styles["notification-trigger"]} aria-label="Thông báo">
                    <Badge count={unreadCount} overflowCount={99} size="small">
                        <BellOutlined />
                    </Badge>
                </button>
            </Tooltip>
        </Popover>
    );
};

export default NotificationBell;
