import { Outlet } from "react-router-dom";
import Header from "../partials/Header";

const AuthLayout = () => {
    return (
        <div className="flex flex-col h-screen">
            {/* En tete */}
            <Header />
            
            {/* Contenu dynamique */}
            <main className='flex flex-col flex-1 flex-grow'>
                <Outlet />
            </main>
        </div>
    );
}

export default AuthLayout;