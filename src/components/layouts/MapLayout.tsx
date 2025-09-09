import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../partials/Header";
import MapComponent from "../maps/MapComponent";
import MapToolbar from "../partials/MapToolbar";

const MapLayout = () => {

  return (
    <div className="flex flex-col h-screen">
      {/* En-tête */}
      <Header />
      
      {/* Contenu principal avec la carte */}
      <main className='flex flex-col flex-1 flex-grow'>
        <MapComponent />
      </main>

      {/* Barre d'outils en bas */}
      <MapToolbar />
    </div>
  );
}

export default MapLayout;