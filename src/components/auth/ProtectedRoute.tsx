import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import React from "react";

export function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: "admin" | "user" }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
