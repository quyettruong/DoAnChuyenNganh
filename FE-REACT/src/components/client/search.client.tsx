import { Button, Col, Form, Row, Select, notification } from 'antd';
import { EnvironmentOutlined, MonitorOutlined, SearchOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils';
import { ProForm } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import { callFetchAllSkill, callFetchCompany, callFetchJob } from '@/config/api';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from '@/styles/client.module.scss';

type HeroStats = {
    jobs: number | null;
    companies: number | null;
    skills: number | null;
};

const SearchClient = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const optionsLocations = LOCATION_LIST;
    const [form] = Form.useForm();
    const [optionsSkills, setOptionsSkills] = useState<{
        label: string;
        value: string;
    }[]>([]);
    const [heroStats, setHeroStats] = useState<HeroStats>({
        jobs: null,
        companies: null,
        skills: null,
    });

    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (location.search) {
            const queryLocation = searchParams.get("location");
            const querySkills = searchParams.get("skills")
            if (queryLocation) {
                form.setFieldValue("location", queryLocation.split(","))
            }
            if (querySkills) {
                form.setFieldValue("skills", querySkills.split(","))
            }
        }
    }, [location.search])

    useEffect(() => {
        fetchSkill();
        fetchHeroStats();
    }, [])

    const fetchSkill = async () => {
        let query = `page=1&size=100&sort=createdAt,desc`;

        try {
            const res = await callFetchAllSkill(query);
            if (res && res.data) {
                const arr = res?.data?.result?.map(item => {
                    return {
                        label: item.name as string,
                        value: item.id + "" as string
                    }
                }) ?? [];
                setOptionsSkills(arr);
                setHeroStats(prev => ({
                    ...prev,
                    skills: res.data?.meta?.total ?? arr.length,
                }));
            }
        } catch (error) {
            setHeroStats(prev => ({ ...prev, skills: 0 }));
        }
    }

    const fetchHeroStats = async () => {
        try {
            const [jobRes, companyRes] = await Promise.all([
                callFetchJob("page=1&size=1"),
                callFetchCompany("page=1&size=1"),
            ]);

            setHeroStats(prev => ({
                ...prev,
                jobs: jobRes?.data?.meta?.total ?? 0,
                companies: companyRes?.data?.meta?.total ?? 0,
            }));
        } catch (error) {
            setHeroStats(prev => ({
                ...prev,
                jobs: 0,
                companies: 0,
            }));
        }
    }

    const renderStat = (value: number | null) => value === null ? "..." : value.toLocaleString("vi-VN");

    const onFinish = async (values: any) => {
        let query = "";
        if (values?.location?.length) {
            query = `location=${values?.location?.join(",")}`;
        }
        if (values?.skills?.length) {
            query = values.location?.length ? query + `&skills=${values?.skills?.join(",")}`
                :
                `skills=${values?.skills?.join(",")}`;
        }

        if (!query) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: "Vui lòng chọn tiêu chí để search"
            });
            return;
        }
        navigate(`/job?${query}`);
    }

    return (
        <div className={styles["search-hero"]}>
            <div className={styles["hero-copy"]}>
                <span className={styles["hero-eyebrow"]}>IT Career Platform</span>
                <h1>Việc làm IT phù hợp kỹ năng của bạn</h1>
                <p>Khám phá công việc mới, công ty nổi bật và mức lương rõ ràng trong một trải nghiệm tuyển dụng gọn gàng hơn.</p>
                <div className={styles["hero-metrics"]}>
                    <span><strong>{renderStat(heroStats.jobs)}</strong> việc làm</span>
                    <span><strong>{renderStat(heroStats.companies)}</strong> công ty</span>
                    <span><strong>{renderStat(heroStats.skills)}</strong> kỹ năng</span>
                </div>
            </div>

            <div className={styles["search-panel"]}>
                <div className={styles["search-heading"]}>
                    <h2>Tìm kiếm nhanh</h2>
                    <p>Chọn kỹ năng và khu vực bạn quan tâm.</p>
                </div>
                <ProForm
                    form={form}
                    onFinish={onFinish}
                    submitter={
                        {
                            render: () => <></>
                        }
                    }
                >
                    <Row gutter={[12, 12]} align="middle" className={styles["search-fields"]}>
                        <Col span={24} md={11}>
                            <ProForm.Item
                                name="skills"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    suffixIcon={null}
                                    className={styles["search-select"]}
                                    style={{ width: '100%' }}
                                    placeholder={
                                        <>
                                            <MonitorOutlined /> Tìm theo kỹ năng...
                                        </>
                                    }
                                    optionLabelProp="label"
                                    options={optionsSkills}
                                />
                            </ProForm.Item>
                        </Col>
                        <Col span={24} md={8}>
                            <ProForm.Item
                                name="location"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    suffixIcon={null}
                                    className={styles["search-select"]}
                                    style={{ width: '100%' }}
                                    placeholder={
                                        <>
                                            <EnvironmentOutlined /> Địa điểm...
                                        </>
                                    }
                                    optionLabelProp="label"
                                    options={optionsLocations}
                                />
                            </ProForm.Item>
                        </Col>
                        <Col span={24} md={5}>
                            <Button
                                type='primary'
                                icon={<SearchOutlined />}
                                className={styles["search-button"]}
                                onClick={() => form.submit()}
                            >
                                Tìm kiếm
                            </Button>
                        </Col>
                    </Row>
                </ProForm>
            </div>
        </div>
    )
}
export default SearchClient;
