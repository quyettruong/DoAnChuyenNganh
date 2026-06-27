import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import Loading from 'components/share/loading';
import ProtectedRoute from 'components/share/protected-route.ts';
import Header from 'components/client/header.client';
import Footer from 'components/client/footer.client';
import styles from 'styles/app.module.scss';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import FloatingSavedJobs from './components/client/saved-jobs/FloatingSavedJobs';
import FloatingSupportChat from './components/client/support-chat/FloatingSupportChat';

const LoginPage = lazy(() => import('pages/auth/login'));
const RegisterPage = lazy(() => import('pages/auth/register'));
const ForgotPassword = lazy(() => import('pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('pages/auth/ResetPassword'));
const LayoutAdmin = lazy(() => import('components/admin/layout.admin'));
const HomePage = lazy(() => import('pages/home'));
const DashboardPage = lazy(() => import('./pages/admin/dashboard'));
const CompanyPage = lazy(() => import('./pages/admin/company'));
const PermissionPage = lazy(() => import('./pages/admin/permission'));
const ResumePage = lazy(() => import('./pages/admin/resume'));
const RolePage = lazy(() => import('./pages/admin/role'));
const UserPage = lazy(() => import('./pages/admin/user'));
const ViewUpsertJob = lazy(() => import('./components/admin/job/upsert.job'));
const ClientJobPage = lazy(() => import('./pages/job'));
const ClientJobDetailPage = lazy(() => import('./pages/job/detail'));
const ClientCompanyPage = lazy(() => import('./pages/company'));
const ClientCompanyDetailPage = lazy(() => import('./pages/company/detail'));
const JobTabs = lazy(() => import('./pages/admin/job/job.tabs'));
const JobMapPage = lazy(() => import('./components/client/map/JobMapPage'));
const CvBuilderPage = lazy(() => import('./pages/cv-builder'));
const MyCvPage = lazy(() => import('./pages/my-cv'));

const withPageLoading = (element: React.ReactNode) => (
  <Suspense fallback={<Loading />}>
    {element}
  </Suspense>
);

const LayoutClient = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);

  return (
    <div className='layout-app' ref={rootRef}>
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className={styles['content-app']}>
        <Outlet context={[searchTerm, setSearchTerm]} />
      </div>
      <Footer />
      <FloatingSupportChat />
      <FloatingSavedJobs />
    </div>
  )
}

export default function App() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.account.isLoading);


  useEffect(() => {
    if (
      window.location.pathname === '/login'
      || window.location.pathname === '/register'
    )
      return;
    dispatch(fetchAccount())
  }, [])

  const router = useMemo(() => createBrowserRouter([
    {
      path: '/',
      element: (<LayoutApp><LayoutClient /></LayoutApp>),
      errorElement: <NotFound />,
      children: [
        { index: true, element: withPageLoading(<HomePage />) },
        { path: 'job', element: withPageLoading(<ClientJobPage />) },
        { path: 'job/:id', element: withPageLoading(<ClientJobDetailPage />) },
        { path: 'company', element: withPageLoading(<ClientCompanyPage />) },
        { path: 'company/:id', element: withPageLoading(<ClientCompanyDetailPage />) },
        { path: 'job-map', element: withPageLoading(<JobMapPage />) },
        { path: 'cv-builder', element: withPageLoading(<CvBuilderPage />) },
        { path: 'my-cv', element: withPageLoading(<MyCvPage />) },
      ],
    },

    {
      path: '/admin',
      element: (<LayoutApp>{withPageLoading(<LayoutAdmin />)}</LayoutApp>),
      errorElement: <NotFound />,
      children: [
        {
          index: true, element:
            <ProtectedRoute>
              {withPageLoading(<DashboardPage />)}
            </ProtectedRoute>
        },
        {
          path: 'company',
          element:
            <ProtectedRoute>
              {withPageLoading(<CompanyPage />)}
            </ProtectedRoute>
        },
        {
          path: 'user',
          element:
            <ProtectedRoute>
              {withPageLoading(<UserPage />)}
            </ProtectedRoute>
        },

        {
          path: 'job',
          children: [
            {
              index: true,
              element: <ProtectedRoute>{withPageLoading(<JobTabs />)}</ProtectedRoute>
            },
            {
              path: 'upsert', element:
                <ProtectedRoute>{withPageLoading(<ViewUpsertJob />)}</ProtectedRoute>
            }
          ]
        },

        {
          path: 'resume',
          element:
            <ProtectedRoute>
              {withPageLoading(<ResumePage />)}
            </ProtectedRoute>
        },
        {
          path: 'permission',
          element:
            <ProtectedRoute>
              {withPageLoading(<PermissionPage />)}
            </ProtectedRoute>
        },
        {
          path: 'role',
          element:
            <ProtectedRoute>
              {withPageLoading(<RolePage />)}
            </ProtectedRoute>
        }
      ],
    },


    {
      path: '/login',
      element: withPageLoading(<LoginPage />),
    },

    {
      path: '/register',
      element: withPageLoading(<RegisterPage />),
    },
    {
      path: '/forgot-password',
      element: withPageLoading(<ForgotPassword />),
    },

    {
      path: '/reset-password',
      element: withPageLoading(<ResetPassword />),
    },
  ]), []);

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}
