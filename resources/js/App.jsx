import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/api';

// Pages - Area Anak (/belajarceria)
import ProfileSelectPage from './pages/child/ProfileSelectPage';
import ModuleMapPage from './pages/child/ModuleMapPage';
import TopicListPage from './pages/child/TopicListPage';
import QuizSessionPage from './pages/child/QuizSessionPage';
import QuizResultPage from './pages/child/QuizResultPage';
import StoryDetailPage from './pages/child/StoryDetailPage';

// Pages - Area Orang Tua (/orangtua)
import ParentLoginPage from './pages/parent/ParentLoginPage';
import ParentRegisterPage from './pages/parent/ParentRegisterPage';
import ParentDashboardPage from './pages/parent/ParentDashboardPage';

// Pages - Area Admin (/admin)
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Guard: Memastikan Orang Tua login terlebih dahulu sebelum bisa mengakses area profil & anak (Poin 1)
function ParentAuthGuard({ children }) {
    if (!isAuthenticated()) {
        return <Navigate to="/orangtua/login" replace />;
    }
    return children;
}

// Guard: Memastikan Admin login terlebih dahulu sebelum bisa mengakses dashboard admin
function AdminAuthGuard({ children }) {
    if (!isAuthenticated()) {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
}

export default function App() {
    return (
        <Routes>
            {/* Rute Awal: Wajib Login Orang Tua Dulu jika belum ada sesi (Poin 1) */}
            <Route 
                path="/" 
                element={
                    isAuthenticated() 
                        ? <Navigate to="/belajarceria" replace /> 
                        : <Navigate to="/orangtua/login" replace />
                } 
            />

            {/* Area Anak (/belajarceria) - Wajib Terproteksi ParentAuthGuard */}
            <Route path="/belajarceria" element={<ParentAuthGuard><ProfileSelectPage /></ParentAuthGuard>} />
            <Route path="/belajarceria/peta" element={<ParentAuthGuard><ModuleMapPage /></ParentAuthGuard>} />
            <Route path="/belajarceria/cerita/baca/:storyId" element={<ParentAuthGuard><StoryDetailPage /></ParentAuthGuard>} />
            <Route path="/belajarceria/:modul" element={<ParentAuthGuard><TopicListPage /></ParentAuthGuard>} />
            <Route path="/belajarceria/:modul/:topicId" element={<ParentAuthGuard><QuizSessionPage /></ParentAuthGuard>} />
            <Route path="/belajarceria/:modul/:topicId/hasil" element={<ParentAuthGuard><QuizResultPage /></ParentAuthGuard>} />

            {/* Area Orang Tua (/orangtua) */}
            <Route path="/orangtua" element={<Navigate to="/orangtua/login" replace />} />
            <Route path="/orangtua/login" element={<ParentLoginPage />} />
            <Route path="/orangtua/daftar" element={<ParentRegisterPage />} />
            <Route path="/orangtua/dashboard" element={<ParentAuthGuard><ParentDashboardPage /></ParentAuthGuard>} />

            {/* Area Admin (/admin) */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminAuthGuard><AdminDashboardPage /></AdminAuthGuard>} />

            {/* Fallback */}
            <Route 
                path="*" 
                element={
                    isAuthenticated() 
                        ? <Navigate to="/belajarceria" replace /> 
                        : <Navigate to="/orangtua/login" replace />
                } 
            />
        </Routes>
    );
}
