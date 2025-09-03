import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCookie } from "../../utils/tools";
import { useSelector } from "react-redux";
import type { AuthState } from "../../app/store/slices/authSlice";

interface AuthProtectedRouteProps {
  children: ReactNode;
}

const AuthProtectedRoute: React.FC<AuthProtectedRouteProps> = ({ children }) => {
    //const isAuthenticated = getCookie("authenticated");
    //const isAuthenticated = getCookie("refreshToken");
    const { isAuthenticated } = useSelector((state : { auth: AuthState }) => state.auth)
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" replace />;
    }
  
    return children;
  };
  
  export default AuthProtectedRoute;