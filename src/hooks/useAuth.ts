import { useSelector } from "react-redux";
import type { AuthState } from "../app/store/slices/authSlice";

const useAuth = () => {
    const { user, isAuthenticated, isLoading, error, token } = useSelector((state : { auth : AuthState }) => state.auth);

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        error
    }
}

export default useAuth;