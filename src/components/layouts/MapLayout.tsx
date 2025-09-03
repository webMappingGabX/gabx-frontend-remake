import { Outlet } from "react-router-dom";
import Header from "../partials/Header";
import MapComponent from "../maps/MapComponent";

const MapLayout = () => {
    return (
        <div className="flex flex-col h-screen">
            {/* En tete */}
            <Header />
            
            {/* Contenu dynamique */}
            <main className='flex flex-col flex-1 flex-grow'>
                {/* <Outlet /> */}
                <MapComponent />
            </main>
        </div>
    );
}

export default MapLayout;