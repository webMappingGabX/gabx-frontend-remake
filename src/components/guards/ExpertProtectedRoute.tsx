import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCookie, isFullyAuthenticated } from "../../utils/tools";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser, type AuthState } from "../../app/store/slices/authSlice";

interface ExpertProtectedRouteProps {
  children: ReactNode;
}

const ExpertProtectedRoute: React.FC<ExpertProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const authUser = useSelector(selectUser);
    if (!isFullyAuthenticated(isAuthenticated)) {
      return <Navigate to="/auth/login" replace />;
    }

    if(authUser?.role == "DEFAULT") return <Navigate to="/403" replace />;
  
    return children;
  };
  
  export default ExpertProtectedRoute;