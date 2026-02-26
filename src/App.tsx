/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { I18nProvider } from '@/context/I18nContext';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import { WebsiteLayout } from "@/layouts/WebsiteLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

import Dashboard from "@/pages/app/Dashboard";
import Workouts from "@/pages/app/Workouts";
import Community from "@/pages/app/Community";
import Chat from "@/pages/app/Chat";
import Profile from "@/pages/app/Profile";
import Tools from "@/pages/app/Tools";
import Pricing from "@/pages/app/Pricing";
import Analytics from "@/pages/app/Analytics";
import Coaching from "@/pages/app/Coaching";
import Onboarding from "@/pages/app/Onboarding";
import Steps from "@/pages/app/Steps";

import AdminDashboard from "@/pages/admin/Dashboard";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Website Routes */}
          <Route element={<WebsiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* User App Routes */}
          <Route path="/app/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/app/onboarding" element={
            <ProtectedRoute role="user">
              <Onboarding />
            </ProtectedRoute>
          } />
          
          <Route element={
            <ProtectedRoute role="user">
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/app/dashboard" element={<Dashboard />} />
            <Route path="/app/workouts" element={<Workouts />} />
            <Route path="/app/steps" element={<Steps />} />
            <Route path="/app/community" element={<Community />} />
            <Route path="/app/chat" element={<Chat />} />
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/tools" element={<Tools />} />
            <Route path="/app/pricing" element={<Pricing />} />
            <Route path="/app/analytics" element={<Analytics />} />
            <Route path="/app/coaching" element={<Coaching />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<div className="p-8">Users Management (Coming Soon)</div>} />
            <Route path="/admin/programs" element={<div className="p-8">Programs Management (Coming Soon)</div>} />
            <Route path="/admin/settings" element={<div className="p-8">Admin Settings (Coming Soon)</div>} />
          </Route>

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
