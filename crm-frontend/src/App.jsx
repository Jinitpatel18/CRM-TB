import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Route-level code splitting: every page loads on demand
const Analytics = lazy(() => import('./pages/Analytics'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Companies = lazy(() => import('./pages/Companies'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));
const Templates = lazy(() => import('./pages/Templates'));
const SendMessage = lazy(() => import('./pages/SendMessage'));
const BulkSend = lazy(() => import('./pages/BulkSend'));
const Meetings = lazy(() => import('./pages/Meetings'));
const Queue = lazy(() => import('./pages/Queue'));
const Settings = lazy(() => import('./pages/Settings'));
const Team = lazy(() => import('./pages/Team'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const CreateOrganization = lazy(() => import('./pages/CreateOrganization'));

// Screen shown while a page chunk is downloading
function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 dark:border-slate-700 border-t-brand-600 dark:border-t-brand-400 animate-spin" />
        </div>
    );
}

export default function App() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/invite/:token" element={<AcceptInvite />} />

                {/* Protected */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/companies" element={<Companies />} />
                                        <Route path="/companies/:id" element={<CompanyDetail />} />
                                        <Route path="/templates" element={<Templates />} />
                                        <Route path="/send" element={<SendMessage />} />
                                        <Route path="/bulk-send" element={<BulkSend />} />
                                        <Route path="/meetings" element={<Meetings />} />
                                        <Route path="/queue" element={<Queue />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/analytics" element={<Analytics />} />
                                        <Route path="/organizations/new" element={<CreateOrganization />} />
                                        {/* Admin-only */}
                                        <Route
                                            path="/team"
                                            element={
                                                <AdminRoute>
                                                    <Team />
                                                </AdminRoute>
                                            }
                                        />
                                        <Route
                                            path="/audit-log"
                                            element={
                                                <AdminRoute>
                                                    <AuditLog />
                                                </AdminRoute>
                                            }
                                        />

                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </Suspense>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Suspense>
    );
}
