import { callFetchJob } from '@/config/api';
import { convertSlug, getLocationName } from '@/config/utils';
import { IJob } from '@/types/backend';
import { ArrowRightOutlined, EnvironmentOutlined, HeartFilled, HeartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Pagination, Row, Spin, Tag, Tooltip } from 'antd';
import { MouseEvent, useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from 'styles/client.module.scss';
import { sfIn } from "spring-filter-query-builder";
import { isJobSaved, SAVED_JOBS_EVENT, toggleSavedJob } from '@/utils/saved-jobs';
import { useAppSelector } from '@/redux/hooks';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


interface IProps {
    showPagination?: boolean;
}

const JobCard = (props: IProps) => {
    const { showPagination = false } = props;

    const [displayJob, setDisplayJob] = useState<IJob[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("");
    const [sortQuery, setSortQuery] = useState("sort=updatedAt,desc");
    const [, setSavedVersion] = useState(0);
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    useEffect(() => {
        fetchJob();
    }, [current, pageSize, filter, sortQuery, location]);

    useEffect(() => {
        const syncSavedState = () => setSavedVersion(prev => prev + 1);
        window.addEventListener(SAVED_JOBS_EVENT, syncSavedState);

        return () => window.removeEventListener(SAVED_JOBS_EVENT, syncSavedState);
    }, []);

    const fetchJob = async () => {
        setIsLoading(true)
        let query = `page=${current}&size=${pageSize}`;
        if (filter) {
            query += `&${filter}`;
        }
        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        //check query string
        const queryLocation = searchParams.get("location");
        const querySkills = searchParams.get("skills")
        if (queryLocation || querySkills) {
            let q = "";
            if (queryLocation) {
                q = sfIn("location", queryLocation.split(",")).toString();
            }

            if (querySkills) {
                q = queryLocation ?
                    q + " and " + `${sfIn("skills", querySkills.split(","))}`
                    : `${sfIn("skills", querySkills.split(","))}`;
            }

            query += `&filter=${encodeURIComponent(q)}`;
        }

        const res = await callFetchJob(query);
        if (res && res.data) {
            setDisplayJob(res.data.result);
            setTotal(res.data.meta.total)
        }
        setIsLoading(false);
    }



    const handleOnchangePage = (pagination: { current: number, pageSize: number }) => {
        if (pagination && pagination.current !== current) {
            setCurrent(pagination.current)
        }
        if (pagination && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize)
            setCurrent(1);
        }
    }

    const handleViewDetailJob = (item: IJob) => {
        const slug = convertSlug(item.name);
        navigate(`/job/${slug}?id=${item.id}`)
    }

    const handleToggleSavedJob = (event: MouseEvent<HTMLElement>, item: IJob) => {
        event.stopPropagation();

        if (!isAuthenticated) {
            const callback = `${location.pathname}${location.search}`;
            navigate(`/login?callback=${encodeURIComponent(callback)}`);
            return;
        }

        toggleSavedJob(item);
        setSavedVersion(prev => prev + 1);
    }

    return (
        <div className={`${styles["card-job-section"]}`}>
            <div className={`${styles["job-content"]}`}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <div>
                                    <span className={styles["title"]}>Công Việc Mới Nhất</span>
                                    <p className={styles["section-subtitle"]}>Cập nhật liên tục các vị trí IT đang tuyển.</p>
                                </div>
                                {!showPagination &&
                                    <Link className={styles["section-link"]} to="job">Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayJob?.map(item => {
                            const saved = isJobSaved(item.id);
                            return (
                                <Col span={24} md={12} key={item.id}>
                                    <Card className={styles["job-card"]} size="small" title={null} hoverable
                                        onClick={() => handleViewDetailJob(item)}
                                    >
                                        <div className={styles["card-job-content"]}>
                                            <div className={styles["card-job-left"]}>
                                                <img
                                                    alt="example"
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${item?.company?.logo}`}
                                                />
                                            </div>
                                            <div className={styles["card-job-right"]}>
                                                <div className={styles["job-company-row"]}>
                                                    <span>{item.company?.name || "IT Company"}</span>
                                                    <div className={styles["job-card-actions"]}>
                                                        {item.level && <Tag color="blue">{item.level}</Tag>}
                                                        <Tooltip title={saved ? "Bỏ lưu việc làm" : "Lưu việc làm"}>
                                                            <Button
                                                                shape="circle"
                                                                type="text"
                                                                aria-label={saved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                                                                className={`${styles["job-save-button"]} ${saved ? styles["job-save-button-active"] : ""}`}
                                                                icon={saved ? <HeartFilled /> : <HeartOutlined />}
                                                                onClick={(event) => handleToggleSavedJob(event, item)}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                <div className={styles["job-title"]}>{item.name}</div>
                                                <div className={styles["job-skills"]}>
                                                    {item.skills?.slice(0, 3).map(skill => (
                                                        <Tag key={skill.id || skill.name}>{skill.name}</Tag>
                                                    ))}
                                                </div>
                                                <div className={styles["job-info-grid"]}>
                                                    <span><EnvironmentOutlined /> {getLocationName(item.location)}</span>
                                                    <span><ThunderboltOutlined /> {(item.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ</span>
                                                </div>
                                                <div className={styles["job-card-footer"]}>
                                                    <span>{item.updatedAt ? dayjs(item.updatedAt).locale('en').fromNow() : dayjs(item.createdAt).locale('en').fromNow()}</span>
                                                    <span className={styles["job-cta"]}>Xem chi tiết <ArrowRightOutlined /></span>
                                                </div>
                                            </div>
                                        </div>

                                    </Card>
                                </Col>
                            )
                        })}


                        {(!displayJob || displayJob && displayJob.length === 0)
                            && !isLoading &&
                            <div className={styles["empty"]}>
                                <Empty description="Không có dữ liệu" />
                            </div>
                        }
                    </Row>
                    {showPagination && <>
                        <div style={{ marginTop: 30 }}></div>
                        <Row style={{ display: "flex", justifyContent: "center" }}>
                            <Pagination
                                current={current}
                                total={total}
                                pageSize={pageSize}
                                responsive
                                onChange={(p: number, s: number) => handleOnchangePage({ current: p, pageSize: s })}
                            />
                        </Row>
                    </>}
                </Spin>
            </div>
        </div>
    )
}

export default JobCard;
