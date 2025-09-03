import { Outlet } from "react-router-dom";
import Header from "../partials/Header";
import Footer from "../partials/Footer";

const MainLayout = () => {
    return (
        <div className="flex flex-col h-screen">
            {/* En tete */}
            <Header />
            
            {/* Contenu dynamique */}
            <main className='flex flex-col flex-1 flex-grow'>
                <Outlet />
            </main>

            {/* Pied de page */}
            <Footer />
        </div>
    );
}

export default MainLayout;