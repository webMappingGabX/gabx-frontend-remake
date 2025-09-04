import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../partials/Header";
import MapComponent from "../maps/MapComponent";
import MapToolbar from "../partials/MapToolbar";

const MapLayout = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isLayersVisible, setIsLayersVisible] = useState(false);

  const handleToggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    setIsLayersVisible(false);
  };

  const handleToggleLayers = () => {
    setIsLayersVisible(!isLayersVisible);
    setIsSearchVisible(false);
  };

  const handleMeasure = () => {
    // Logique de mesure à implémenter
    console.log("Outil de mesure activé");
  };

  const handleExport = () => {
    // Logique d'export à implémenter
    console.log("Outil d'export activé");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* En-tête */}
      <Header />
      
      {/* Contenu principal avec la carte */}
      <main className='flex flex-col flex-1 flex-grow'>
        <MapComponent />
      </main>

      {/* Barre d'outils en bas */}
      <MapToolbar
        onToggleSearch={handleToggleSearch}
        onToggleLayers={handleToggleLayers}
        onMeasure={handleMeasure}
        onExport={handleExport}
        isSearchVisible={isSearchVisible}
        isLayersVisible={isLayersVisible}
      />
    </div>
  );
}

export default MapLayout;