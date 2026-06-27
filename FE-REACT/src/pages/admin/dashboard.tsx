import { Card, Col, Row, Statistic } from "antd";
import CountUp from 'react-countup';
import { BankOutlined, FileDoneOutlined, TeamOutlined } from "@ant-design/icons";

const DashboardPage = () => {
    const formatter = (value: number | string) => {
        return (
            <CountUp end={Number(value)} separator="," />
        );
    };

    return (
        <>
            <div className="admin-page-heading">
                <h1>Dashboard</h1>
                <p>Tổng quan nhanh về dữ liệu tuyển dụng trong hệ thống.</p>
            </div>
            <Row gutter={[20, 20]}>
                <Col span={24} md={8}>
                    <Card className="dashboard-card" bordered={false}>
                        <span className="dashboard-icon users"><TeamOutlined /></span>
                        <Statistic
                            title="Người dùng"
                            value={112893}
                            formatter={formatter}
                        />
                    </Card>
                </Col>
                <Col span={24} md={8}>
                    <Card className="dashboard-card" bordered={false}>
                        <span className="dashboard-icon jobs"><BankOutlined /></span>
                        <Statistic
                            title="Công ty / việc làm"
                            value={2480}
                            formatter={formatter}
                        />
                    </Card>
                </Col>
                <Col span={24} md={8}>
                    <Card className="dashboard-card" bordered={false}>
                        <span className="dashboard-icon resumes"><FileDoneOutlined /></span>
                        <Statistic
                            title="Hồ sơ ứng tuyển"
                            value={8694}
                            formatter={formatter}
                        />
                    </Card>
                </Col>
            </Row>
        </>
    )
}

export default DashboardPage;
