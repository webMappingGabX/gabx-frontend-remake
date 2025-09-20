import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../partials/Header";
import MapToolbar from "../partials/MapToolbar";
import Map2D from "../maps/Map2D";

const MapLayout = () => {

  return (
    <div className="flex flex-col h-screen">
      {/* En-tête */}
      <Header />
      
      {/* Contenu principal avec la carte */}
      <main className='flex flex-col flex-1 flex-grow'>
        {/* <Map2D /> */}
        <Outlet />
      </main>

      {/* Barre d'outils en bas */}
      <MapToolbar />
    </div>
  );
}

export default MapLayout;