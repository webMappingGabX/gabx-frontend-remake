import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  Minus, 
  Layers, 
  Compass, 
  Ruler, 
  Download,
  Search,
  Fullscreen
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Toggle } from "../ui/toggle";
import { useToast } from "../../hooks/useToast";

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDispatch, useSelector } from "react-redux";
import { AvailableMenus, selectLayers, selectMenu, selectSearch } from "../../app/store/slices/settingSlice";
import FileMenu from "../menus/FileMenu";
import { fetchPlots, selectPlots } from "../../app/store/slices/plotSlice";
import { isFulfilled } from "@reduxjs/toolkit";

// Icônes personnalisées pour Leaflet (important pour le bon affichage)
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types pour les données géospatiales
interface Parcelle {
  id: string;
  nom: string;
  superficie: number;
  coordinates: [number, number][];
  type: string;
  proprietaire: string;
}

interface MapViewport {
  center: [number, number];
  zoom: number;
}

const MapComponent = () => {
  const [viewport, setViewport] = useState<MapViewport>({
    center: [3.868177, 11.519596],
    zoom: 16
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedParcelle, setSelectedParcelle] = useState<Parcelle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLayers, setActiveLayers] = useState({
    parcelles: true,
    limites: true,
    batiments: false,
    reseau: false
  });
  const { toast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null); // Référence pour l'instance de carte Leaflet
  const [parcelleLayers, setParcelleLayers] = useState<L.LayerGroup | null>(null);

  const dispatch = useDispatch();
  const isSearchActive = useSelector(selectSearch);
  const isLayersActive = useSelector(selectLayers);
  const currentOpenedMenu = useSelector(selectMenu);
  const selectedPlots = useSelector(selectPlots);

  const [parcelles] = useState<Parcelle[]>([
    {
      id: "YDE-001",
      nom: "Parcelle Bastos",
      superficie: 4.5,
      coordinates: [
        [3.8700, 11.5200],
        [3.8720, 11.5200],
        [3.8720, 11.5180],
        [3.8700, 11.5180]
      ],
      type: "Résidentielle",
      proprietaire: "Jean Mvondo"
    },
    {
      id: "YDE-002",
      nom: "Parcelle Mvog Ada",
      superficie: 3.2,
      coordinates: [
        [3.8660, 11.5220],
        [3.8680, 11.5220],
        [3.8680, 11.5200],
        [3.8660, 11.5200]
      ],
      type: "Commerciale",
      proprietaire: "Aminatou Oumarou"
    }
  ]);

  const multiStyle = {
    color: '#f59e42',
    weight: 2,
    fillColor: '#f59e42',
    fillOpacity: 0.2
  };

  const uniStyle = {
    color: '#42F58ABE',
    weight: 2,
    fillColor: '#42F58ABE',
    fillOpacity: 0.2
  };

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Création de l'instance de carte Leaflet
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false  // Désactive les contrôles de zoom par défaut
      }).setView(
        [viewport.center[0], viewport.center[1]], 
        viewport.zoom
      );
      
      // Ajout de la couche tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
      
      // Création d'un groupe de layers pour les parcelles
      const layerGroup = L.layerGroup().addTo(mapInstance.current);
      setParcelleLayers(layerGroup);
      
      // Gestionnaire d'événements pour les mouvements de carte
      mapInstance.current.on('move', () => {
        if (mapInstance.current) {
          const center = mapInstance.current.getCenter();
          const zoom = mapInstance.current.getZoom();
          setViewport({
            center: [center.lat, center.lng],
            zoom: zoom
          });
        }
      });
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchAndFilterPlots = async () => {
      // Chargement des parceslles
      const getPlotsResponses = await dispatch(fetchPlots({ search: searchQuery }));
      console.log("GET PLOT RESPONSE", getPlotsResponses);
      if(getPlotsResponses.type.includes("fulfilled")) {
        console.log("FULLFILLED PLOTS");
      }
    }

    fetchAndFilterPlots();
  }, [searchQuery]);

  useEffect(() => {
    console.log("FILTERS PLOTS", selectedPlots);
  }, [searchQuery]);

  useEffect(() => {
    if (!mapInstance.current || !parcelleLayers) return;
    
    // Nettoyer les layers existants
    parcelleLayers.clearLayers();
    
    // Ajouter chaque parcelle comme polygone
    parcelles.forEach(parcelle => {
      // Créer le polygone avec les coordonnées [lat, lng]
      const polygon = L.polygon(parcelle.coordinates, {
        color: selectedParcelle?.id === parcelle.id ? '#3b82f6' : '#10b981',
        weight: 2,
        fillColor: selectedParcelle?.id === parcelle.id ? '#3b82f6' : '#10b981',
        fillOpacity: 0.2
      });
      
      // Ajouter un popup au polygone
      polygon.bindPopup(`
        <div>
          <h3 class="font-bold">${parcelle.nom}</h3>
          <p>ID: ${parcelle.id}</p>
          <p>Superficie: ${parcelle.superficie} ha</p>
          <p>Type: ${parcelle.type}</p>
          <p>Propriétaire: ${parcelle.proprietaire}</p>
        </div>
      `);
      
      // Gestionnaire de clic
      polygon.on('click', () => {
        setSelectedParcelle(parcelle);
      });
      
      // Ajouter à la carte
      polygon.addTo(parcelleLayers);
    });
    selectedPlots?.forEach((plot) => {
        // Get geometries in plot
        plot?.geom?.geometries?.forEach((geom) => {
          if (geom.type.toLowerCase() === "multipolygon") {
            geom.coordinates.forEach((polygonCoords: any) => {
              const latlngs = polygonCoords.map((ring: any) =>
                ring.map((coord: any) => [coord[1], coord[0]])
              );
              const polygon = L.polygon(latlngs, multiStyle);
              polygon.addTo(parcelleLayers);
            });
          } else if (geom.type.toLowerCase() === "polygon") {
            const latlngs = geom.coordinates.map((ring: any) => ring.map((coord: any) => [coord[1], coord[0]]));
            const polygon = L.polygon(latlngs, uniStyle);

            polygon.addTo(parcelleLayers);
          } else if (geom.type.toLowerCase() === "multilinestring") {
              geom.coordinates.forEach((lineCoord: any) => {
                const latlngs = lineCoord.map((coord: any) => [coord[1], coord[0]]);

                const line = L.polyline(latlngs, multiStyle);
                
                //line.addTo(parcelleLayers);
              });
          } else if (geom.type.toLowerCase() === "linestring") {
              const latlngs = geom.coordinates.forEach((coord: any) => [coord[1], coord[0]]);
              const line = L.polyline(latlngs, multiStyle);
              
              //line.addTo(parcelleLayers);
          } else if (geom.type.toLowerCase() === "multipoint") {
             geom.coordinates.forEach((coord: any) => {
              const latlng = [coord[1], coord[0]];
              const marker = L.marker(latlng, { icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] }) });
              
              // marker.addTo(parcelleLayers);
             })
          } else if (geom.type.toLowerCase() === "point") {
            const coord = geom.coordinates;
            const latlng = [coord[1], coord[0]];
            const marker = L.marker(latlng, { icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] }) });
            
            // marker.addTo(parcelleLayers);
         } else {
          throw new Error("Unsupported geometry type: " + geom.type);
         }
        });
    });
  }, [parcelles, selectedParcelle, parcelleLayers]);
  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && mapRef.current) {
      mapRef.current.requestFullscreen().catch(err => {
        console.error('Erreur lors du passage en plein écran:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Gestion des événements de plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!parcelleLayers) return;
    
    if (activeLayers.parcelles) {
      mapInstance.current?.addLayer(parcelleLayers);
    } else {
      mapInstance.current?.removeLayer(parcelleLayers);
    }
  }, [activeLayers.parcelles, parcelleLayers]);
  
  // Zoom avant
  const zoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn();
    }
  };

  // Zoom arrière
  const zoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut();
    }
  };

  // Recentrer la carte sur Libreville
  const resetView = () => {
    if (mapInstance.current) {
      mapInstance.current.setView([3.868177, 11.519596], 12);
    }
  };

  // Recherche de parcelles (avec animation vers la parcelle)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = parcelles.find(p => 
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id === searchQuery
    );
    
    if (found && mapInstance.current) {
      // Centrer la carte sur la parcelle trouvée
      const centerLatLng = [found.coordinates[0][0], found.coordinates[0][1]] as [number, number];
      mapInstance.current.flyTo(centerLatLng, 15);
      
      setSelectedParcelle(found);
      toast({
        title: "Parcelle trouvée",
        description: `Parcelle ${found.nom} sélectionnée.`
      });
    } else {
      toast({
        title: "Aucun résultat",
        description: "Aucune parcelle ne correspond à votre recherche.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* Conteneur principal de la carte Leaflet */}
      <div 
        ref={mapRef} 
        className="z-0 w-full h-full"
      />



      {/* Overlay d'information de la parcelle sélectionnée */}
      {selectedParcelle && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-[1000] max-w-sm top-14 left-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedParcelle.nom}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    ID: {selectedParcelle.id} | {selectedParcelle.superficie} ha
                  </p>
                  <p className="text-sm">Type: {selectedParcelle.type}</p>
                  <p className="text-sm">Propriétaire: {selectedParcelle.proprietaire}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedParcelle(null)}
                >
                  ×
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">Détails</Button>
                <Button size="sm">Modifier</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Contrôles de zoom */}
      <div className="absolute z-[1000] flex flex-col gap-2 right-4 bottom-4">
        <Button onClick={zoomIn} size="icon" className="rounded-full">
          <Plus className="w-4 h-4" />
        </Button>
        <Button onClick={zoomOut} size="icon" className="rounded-full">
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Barre d'outils principale */}
      <div className="absolute z-[1000] flex flex-col gap-2 top-14 right-4">
        <Button onClick={toggleFullscreen} size="icon" variant="outline">
          <Fullscreen className="w-4 h-4" />
        </Button>
        <Button onClick={resetView} size="icon" variant="outline">
          <Compass className="w-4 h-4" />
        </Button>
      </div>

      {/* Barre de recherche */}
      <AnimatePresence>
        {isSearchActive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0}}
            className="absolute z-[1000] transform -translate-x-1/2 top-4 left-1/2 md:w-80 w-5/6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/90 dark:bg-slate-800/90"
              />
              <Button type="submit" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contrôles de couches */}
      <AnimatePresence>
        {isLayersActive && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            // className="absolute z-[1000] left-4 bottom-24"
            className="absolute z-[1000] left-4 top-14"
          >
            <Card className="py-1">
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Parcelles</span>
                    <Toggle
                      pressed={activeLayers.parcelles}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, parcelles: pressed})}
                      size="sm"
                    >
                      <Layers className="w-4 h-4" />
                    </Toggle>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Limites</span>
                    <Toggle
                      pressed={activeLayers.limites}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, limites: pressed})}
                      size="sm"
                    >
                      <Layers className="w-4 h-4" />
                    </Toggle>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Menu Fichier */}
      { currentOpenedMenu === AvailableMenus.FILE ? (<FileMenu />) : null }
      {/* Indicateur de coordonnées */}
      <div className="absolute z-[1000] px-2 py-1 text-xs text-white rounded bottom-5 right-20 bg-black/70">
        {viewport.center[0].toFixed(4)}, {viewport.center[1].toFixed(4)} | Zoom: {viewport.zoom}
      </div>
    </div>
  );
};

export default MapComponent;