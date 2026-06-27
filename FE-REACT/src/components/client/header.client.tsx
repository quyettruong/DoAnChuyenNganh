import { useState, useEffect } from 'react';
import { CodeOutlined, ContactsOutlined, EnvironmentOutlined, FileTextOutlined, FireOutlined, HomeOutlined, LogoutOutlined, MenuFoldOutlined, RiseOutlined } from '@ant-design/icons';
import { Avatar, Drawer, Dropdown, Grid, MenuProps, Space, message } from 'antd';
import { Menu, ConfigProvider } from 'antd';
import styles from '@/styles/client.module.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import ManageAccount from './modal/manage.account';
import NotificationBell from './notification-bell';

const Header = (props: any) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const avatarUrl = user?.avatar ? `${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${user.avatar}` : undefined;
    const screens = Grid.useBreakpoint();
    const isMobileHeader = !screens.md;
    const [openMobileMenu, setOpenMobileMenu] = useState<boolean>(false);

    const [current, setCurrent] = useState('home');
    const location = useLocation();

    const [openMangeAccount, setOpenManageAccount] = useState<boolean>(false);
    const [manageAccountTab, setManageAccountTab] = useState<string>("user-resume");

    useEffect(() => {
        setCurrent(location.pathname);
    }, [location])

    const items: MenuProps['items'] = [
        {
            label: <Link to={'/'}>Trang Chủ</Link>,
            key: '/',
            icon: <HomeOutlined />,
        },
        {
            label: <Link to={'/job'}>Việc Làm IT</Link>,
            key: '/job',
            icon: <CodeOutlined />,
        },
        {
            label: <Link to={'/company'}>Top Công ty IT</Link>,
            key: '/company',
            icon: <RiseOutlined />,
        },
        {
            label: <Link to={'/job-map'}>Bản đồ</Link>,
            key: '/job-map',
            icon: <EnvironmentOutlined />,
        },
        {
            label: <Link to={'/cv-builder'}>Tạo CV</Link>,
            key: '/cv-builder',
            icon: <FileTextOutlined />,
        }
    ];



    const onClick: MenuProps['onClick'] = (e) => {
        setCurrent(e.key);
    };

    const handleToggleMobileMenu = () => {
        setOpenMobileMenu((previous) => !previous);
    };

    const handleMobileMenuClick: MenuProps['onClick'] = (e) => {
        onClick(e);
        setOpenMobileMenu(false);
    };

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && res && +res.statusCode === 200) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/')
        }
    }

    const handleOpenResumeApplications = () => {
        setManageAccountTab("user-resume");
        setOpenManageAccount(true);
    };

    const handleOpenManageAccount = () => {
        setManageAccountTab("user-update-info");
        setOpenManageAccount(true);
    };

    const itemsDropdown = [
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={handleOpenManageAccount}
            >Quản lý tài khoản</label>,
            key: 'manage-account',
            icon: <ContactsOutlined />
        },
        {
            label: <Link to={"/my-cv"}>Quản lý CV cá nhân</Link>,
            key: 'my-cv',
            icon: <FileTextOutlined />
        },
        ...(user.role?.permissions?.length ? [{
            label: <Link
                to={"/admin"}
            >Trang Quản Trị</Link>,
            key: 'admin',
            icon: <FireOutlined />
        },] : []),

        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
            icon: <LogoutOutlined />
        },
    ];

    const authMobileItems = isAuthenticated === false
        ? [{
            label: <Link to={'/login'}>Đăng Nhập</Link>,
            key: 'login',
            icon: <ContactsOutlined />
        }]
        : itemsDropdown;

    const itemsMobiles = [...items, ...authMobileItems];

    return (
        <>
            <div className={styles["header-section"]}>
                <div className={styles["container"]}>
                    {!isMobileHeader ?
                        <div className={styles["desktop-shell"]}>
                            <div className={styles['brand']} onClick={() => navigate('/')} >
                                <span className={styles["brand-mark"]}><CodeOutlined /></span>
                                <span className={styles["brand-text"]}>IT Career</span>
                            </div>
                            <div className={styles['top-menu']}>
                                <ConfigProvider
                                    theme={{
                                        token: {
                                            colorPrimary: '#2563eb',
                                            colorBgContainer: '#ffffff',
                                            colorText: '#344054',
                                        },
                                    }}
                                >

                                    <Menu
                                        onClick={onClick}
                                        disabledOverflow
                                        selectedKeys={[current]}
                                        mode="horizontal"
                                        items={items}
                                    />
                                </ConfigProvider>
                                <div className={styles['extra']}>
                                    {isAuthenticated === false ?
                                        <Link to={'/login'}>Đăng Nhập</Link>
                                        :
                                        <>
                                            <NotificationBell onOpenResumeApplications={handleOpenResumeApplications} />
                                            <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                                <Space className={styles["account-trigger"]}>
                                                    <span>{user?.name}</span>
                                                    <Avatar src={avatarUrl}> {user?.name?.substring(0, 2)?.toUpperCase()} </Avatar>
                                                </Space>
                                            </Dropdown>
                                        </>
                                    }

                                </div>

                            </div>
                        </div>
                        :
                        <div className={styles['header-mobile']}>
                            <span className={styles["mobile-brand"]}><CodeOutlined /> IT Career</span>
                            <div className={styles["mobile-actions"]}>
                                <NotificationBell onOpenResumeApplications={handleOpenResumeApplications} />
                                <button
                                    type="button"
                                    className={`${styles["mobile-menu-button"]} ${openMobileMenu ? styles["mobile-menu-button-open"] : ""}`}
                                    aria-label="Mở menu điều hướng"
                                    aria-expanded={openMobileMenu}
                                    onClick={handleToggleMobileMenu}
                                >
                                    <MenuFoldOutlined />
                                </button>
                            </div>
                        </div>
                    }
                </div>
            </div>
            <Drawer
                title={(
                    <span className={styles["mobile-drawer-title"]}>
                        <span className={styles["mobile-drawer-mark"]}><CodeOutlined /></span>
                        IT Career
                    </span>
                )}
                placement="right"
                rootClassName={styles["mobile-drawer"]}
                onClose={() => setOpenMobileMenu(false)}
                open={openMobileMenu}
            >
                <Menu
                    onClick={handleMobileMenuClick}
                    selectedKeys={[current]}
                    mode="vertical"
                    items={itemsMobiles}
                />
            </Drawer>
            <ManageAccount
                open={openMangeAccount}
                onClose={setOpenManageAccount}
                defaultActiveKey={manageAccountTab}
            />
        </>
    )
};

export default Header;
