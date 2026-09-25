import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Templates from './pages/Templates';
import SendMessage from './pages/SendMessage';
import BulkSend from './pages/BulkSend';
import Meetings from './pages/Meetings';
import Queue from './pages/Queue';
import Settings from './pages/Settings';
import Team from './pages/Team';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AcceptInvite from './pages/AcceptInvite';
import CreateOrganization from './pages/CreateOrganization';

export default function App() {
    return (
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
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/companies" element={<Companies />} />
                                <Route path="/companies/:id" element={<CompanyDetail />} />
                                <Route path="/templates" element={<Templates />} />
                                <Route path="/send" element={<SendMessage />} />
                                <Route path="/bulk-send" element={<BulkSend />} />
                                <Route path="/meetings" element={<Meetings />} />
                                <Route path="/queue" element={<Queue />} />
                                <Route path ="/settings" element={<Settings />} />
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
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}