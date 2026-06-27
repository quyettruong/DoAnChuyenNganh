import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Alert, Button, Empty, Select, Spin, Tag } from "antd";
import { AimOutlined, ArrowLeftOutlined, EnvironmentOutlined, FilterOutlined, SearchOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { IJob, ISkill } from "@/types/backend";
import { callFetchAllSkill, callFetchJob, callFetchJobById } from "@/config/api";
import { convertSlug, getLocationName } from "@/config/utils";
import RoutingControl from "./RoutingControl";
import styles from "@/styles/client.module.scss";

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const LEVEL_OPTIONS = [
    { label: "Intern", value: "INTERN" },
    { label: "Fresher", value: "FRESHER" },
    { label: "Junior", value: "JUNIOR" },
    { label: "Middle", value: "MIDDLE" },
    { label: "Senior", value: "SENIOR" },
];

const HCMC_CENTER: [number, number] = [10.776889, 106.700806];

const formatSalary = (value: number) => `${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const MapAutoFit = ({ jobs }: { jobs: IJob[] }) => {
    const map = useMap();

    useEffect(() => {
        const points = jobs
            .filter(item => item.latitude != null && item.longitude != null)
            .map(item => [item.latitude as number, item.longitude as number] as [number, number]);

        if (!points.length) return;

        if (points.length === 1) {
            map.setView(points[0], 14);
            return;
        }

        map.fitBounds(L.latLngBounds(points), {
            padding: [42, 42],
            maxZoom: 14,
        });
    }, [jobs, map]);

    return null;
};

const MapLayoutSync = () => {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });

        observer.observe(container);
        const timer = window.setTimeout(() => map.invalidateSize(), 120);

        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
        };
    }, [map]);

    return null;
};

const JobMapPage: React.FC = () => {
    const [job, setJob] = useState<IJob | null>(null);
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [skills, setSkills] = useState<{ label: string; value: string }[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [startLat, setStartLat] = useState<number | null>(null);
    const [startLng, setStartLng] = useState<number | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get("id"); // lấy ?id= trên URL
    const isSingleJobMode = !!id;

    useEffect(() => {
        const init = async () => {
            setLoading(true);

            if (id) {
                const res = await callFetchJobById(id);
                if (res?.data) {
                    setJob(res.data);
                }
                setLoading(false);
                return;
            }

            const [jobRes, skillRes] = await Promise.all([
                callFetchJob("page=1&size=500&sort=updatedAt,desc"),
                callFetchAllSkill("page=1&size=100&sort=createdAt,desc"),
            ]);

            setJobs(jobRes?.data?.result ?? []);
            setSkills((skillRes?.data?.result ?? []).map((item: ISkill) => ({
                label: item.name as string,
                value: `${item.id}`,
            })));
            setLoading(false);
        };
        init();
    }, [id]);

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Trình duyệt không hỗ trợ định vị");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                console.log("Vị trí hiện tại:", latitude, longitude, "Độ chính xác:", accuracy);

                setStartLat(latitude);
                setStartLng(longitude);
            },
            (err) => {
                console.error("Lỗi lấy vị trí:", err);
                alert("Không thể lấy vị trí hiện tại. Hãy bật GPS và thử lại!");
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );

    };

    const jobsWithLocation = useMemo(() => {
        return jobs.filter(item => item.latitude != null && item.longitude != null);
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        return jobsWithLocation.filter(item => {
            const matchSkill = !selectedSkills.length || item.skills?.some(skill => selectedSkills.includes(`${skill.id}`));
            const matchLevel = !selectedLevels.length || selectedLevels.includes(item.level);

            return matchSkill && matchLevel;
        });
    }, [jobsWithLocation, selectedLevels, selectedSkills]);

    const handleViewDetailJob = (item: IJob) => {
        const slug = convertSlug(item.name);
        navigate(`/job/${slug}?id=${item.id}`);
    };

    if (loading || (isSingleJobMode && !job)) {
        return (
            <div className={`${styles["container"]} ${styles["map-page"]}`}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
                <div className={styles["map-loading"]}>
                    <Spin />
                </div>
            </div>
        );
    }

    if (!isSingleJobMode) {
        return (
            <div className={`${styles["container"]} ${styles["map-page"]}`}>
                <div className={styles["map-toolbar"]}>
                    <div className={styles["map-title-block"]}>
                        <span>
                            <EnvironmentOutlined /> Bản đồ việc làm
                        </span>
                        <h1>Tìm việc IT theo khu vực</h1>
                        <p>Chọn kỹ năng và trình độ để bản đồ chỉ còn hiển thị các công việc phù hợp.</p>
                    </div>
                    <div className={styles["map-count"]}>
                        <strong>{filteredJobs.length}</strong>
                        <span>việc làm phù hợp</span>
                    </div>
                </div>

                <div className={styles["job-map-layout"]}>
                    <aside className={styles["job-map-filter"]}>
                        <div className={styles["job-map-filter-heading"]}>
                            <span><FilterOutlined /> Bộ lọc</span>
                            <Button
                                type="link"
                                onClick={() => {
                                    setSelectedSkills([]);
                                    setSelectedLevels([]);
                                }}
                            >
                                Xóa lọc
                            </Button>
                        </div>

                        <label>Kỹ năng</label>
                        <Select
                            mode="multiple"
                            allowClear
                            value={selectedSkills}
                            options={skills}
                            placeholder="Chọn kỹ năng..."
                            suffixIcon={null}
                            onChange={setSelectedSkills}
                        />

                        <label>Trình độ</label>
                        <Select
                            mode="multiple"
                            allowClear
                            value={selectedLevels}
                            options={LEVEL_OPTIONS}
                            placeholder="Chọn trình độ..."
                            suffixIcon={null}
                            onChange={setSelectedLevels}
                        />

                        <div className={styles["job-map-filter-note"]}>
                            <SearchOutlined />
                            <span>{jobsWithLocation.length} việc làm có tọa độ đang được đưa lên bản đồ.</span>
                        </div>
                    </aside>

                    <div className={styles["map-card"]}>
                        {filteredJobs.length ? (
                            <MapContainer
                                className={styles["map-canvas"]}
                                center={HCMC_CENTER}
                                zoom={12}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />

                                <MapAutoFit jobs={filteredJobs} />
                                <MapLayoutSync />

                                {filteredJobs.map(item => (
                                    <Marker
                                        key={item.id}
                                        position={[item.latitude as number, item.longitude as number]}
                                    >
                                        <Popup>
                                            <div className={styles["job-map-popup"]}>
                                                <strong>{item.name}</strong>
                                                <span>{item.company?.name || "IT Company"}</span>
                                                <span><EnvironmentOutlined /> {getLocationName(item.location)}</span>
                                                <span><ThunderboltOutlined /> {formatSalary(item.salary)} đ</span>
                                                <div>
                                                    {item.level && <Tag color="blue">{item.level}</Tag>}
                                                    {item.skills?.slice(0, 2).map(skill => (
                                                        <Tag key={skill.id || skill.name}>{skill.name}</Tag>
                                                    ))}
                                                </div>
                                                <Button type="primary" size="small" onClick={() => handleViewDetailJob(item)}>
                                                    Xem chi tiết
                                                </Button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        ) : (
                            <div className={styles["map-empty-state"]}>
                                <Empty description="Không có việc làm phù hợp trên bản đồ" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Nếu job không có tọa độ thì báo nhẹ
    if (!job || job.latitude == null || job.longitude == null) {
        return (
            <div className={`${styles["container"]} ${styles["map-page"]}`}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
                <Alert
                    className={styles["map-empty"]}
                    type="warning"
                    showIcon
                    message="Job này chưa có thông tin vị trí"
                    description="Bạn cần cập nhật latitude/longitude cho job trước khi xem bản đồ."
                />
            </div>
        );
    }

    const lat = job.latitude;
    const lng = job.longitude;

    return (
        <div className={`${styles["container"]} ${styles["map-page"]}`}>
            <div className={styles["map-toolbar"]}>
                <div className={styles["map-title-block"]}>
                    <span>
                        <EnvironmentOutlined /> Bản đồ vị trí
                    </span>
                    <h1>{job.name}</h1>
                    <p>{job.company?.name}</p>
                </div>

                <div className={styles["map-actions"]}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                    <Button type="primary" icon={<AimOutlined />} onClick={handleUseMyLocation}>
                        Đường đi từ vị trí của tôi
                    </Button>
                </div>
            </div>

            <div className={styles["map-card"]}>
                <MapContainer
                    className={styles["map-canvas"]}
                    center={[lat, lng]}
                    zoom={16}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MapLayoutSync />

                    <Marker position={[lat, lng]} />

                    {/* Có vị trí người dùng rồi thì vẽ đường đi ngắn nhất */}
                    {startLat != null && startLng != null && (
                        <RoutingControl start={[startLat, startLng]} end={[lat, lng]} />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default JobMapPage;
