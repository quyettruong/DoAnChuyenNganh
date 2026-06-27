import { useEffect, useState } from "react";
import { Badge, Button, Drawer, Empty, Grid, Tag } from "antd";
import { DeleteOutlined, EnvironmentOutlined, HeartFilled, ThunderboltOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { convertSlug, getLocationName } from "@/config/utils";
import { getSavedJobs, removeSavedJob, SAVED_JOBS_EVENT, SavedJobItem } from "@/utils/saved-jobs";
import { useAppSelector } from "@/redux/hooks";
import styles from "@/styles/client.module.scss";

const formatSalary = (value?: number) => `${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const FloatingSavedJobs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const [open, setOpen] = useState(false);
    const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
    const drawerWidth = screens.sm ? 420 : "100%";

    const syncSavedJobs = () => setSavedJobs(getSavedJobs());

    useEffect(() => {
        syncSavedJobs();
        window.addEventListener(SAVED_JOBS_EVENT, syncSavedJobs);
        window.addEventListener("storage", syncSavedJobs);

        return () => {
            window.removeEventListener(SAVED_JOBS_EVENT, syncSavedJobs);
            window.removeEventListener("storage", syncSavedJobs);
        };
    }, []);

    const handleViewDetail = (job: SavedJobItem) => {
        setOpen(false);
        navigate(`/job/${convertSlug(job.name)}?id=${job.id}`);
    };

    const handleToggleDrawer = () => {
        if (!isAuthenticated) {
            const callback = `${location.pathname}${location.search}`;
            navigate(`/login?callback=${encodeURIComponent(callback)}`);
            return;
        }

        setOpen(prev => !prev);
    };

    return (
        <>
            <div className={`${styles["saved-jobs-float"]} ${open ? styles["saved-jobs-float-open"] : ""}`}>
                <div className={styles["saved-jobs-hint"]}>
                    {open ? "Đóng danh sách đã lưu" : "Danh sách việc làm đã lưu"}
                </div>
                <Badge count={savedJobs.length} size="small" offset={[-2, 6]}>
                    <button
                        type="button"
                        className={`${styles["saved-jobs-button"]} ${open ? styles["saved-jobs-button-open"] : ""}`}
                        aria-label="Danh sách việc làm đã lưu"
                        aria-expanded={open}
                        onClick={handleToggleDrawer}
                    >
                        <HeartFilled />
                    </button>
                </Badge>
            </div>

            <Drawer
                title="Việc làm đã lưu"
                placement="right"
                width={drawerWidth}
                rootClassName={styles["saved-jobs-drawer"]}
                open={open}
                onClose={() => setOpen(false)}
            >
                {savedJobs.length ? (
                    <div className={styles["saved-jobs-list"]}>
                        {savedJobs.map(job => (
                            <div className={styles["saved-job-item"]} key={job.id}>
                                <div className={styles["saved-job-logo"]}>
                                    {job.companyLogo ? (
                                        <img
                                            alt={job.companyName || job.name}
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${job.companyLogo}`}
                                        />
                                    ) : (
                                        <HeartFilled />
                                    )}
                                </div>

                                <div className={styles["saved-job-content"]}>
                                    <button type="button" onClick={() => handleViewDetail(job)}>
                                        {job.name}
                                    </button>
                                    <span>{job.companyName || "IT Company"}</span>
                                    <div className={styles["saved-job-meta"]}>
                                        <span><EnvironmentOutlined /> {getLocationName(job.location || "")}</span>
                                        <span><ThunderboltOutlined /> {formatSalary(job.salary)} đ</span>
                                    </div>
                                    <div className={styles["saved-job-tags"]}>
                                        {job.level && <Tag color="blue">{job.level}</Tag>}
                                        {job.skills?.slice(0, 2).map(skill => (
                                            <Tag key={skill.id || skill.name}>{skill.name}</Tag>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeSavedJob(job.id)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty description="Bạn chưa lưu việc làm nào" />
                )}
            </Drawer>
        </>
    );
};

export default FloatingSavedJobs;
