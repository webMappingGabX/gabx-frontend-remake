import React, { useState, useRef, useEffect } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import type { PickingInfo, MapViewState } from '@deck.gl/core';
import type { FeatureCollection, Polygon } from 'geojson';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Layers, 
  Compass, 
  Search,
  Fullscreen,
  Camera,
  Crop
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Toggle } from "../ui/toggle";
import { useToast } from "../../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { 
  AvailableMenus, 
  selectExcludedTypes, 
  selectLayers, 
  selectMenu, 
  selectOverlaps, 
  selectSearch 
} from "../../app/store/slices/settingSlice";
import { deleteBuilding, fetchBuildings, selectBuildings } from "../../app/store/slices/buildingSlice";
import { setCurrentPlot } from "../../app/store/slices/plotSlice";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import FileMenu from "../menus/FileMenu";
import EditionMenu from "../menus/EditionMenu";
import ViewMenu from "../menus/ViewMenu";
import ExportMenu from "../menus/ExportMenu";

// Types pour vos données
interface BuildingProperties {
  height: number;
  name?: string;
  color?: [number, number, number];
  id: string;
  code?: string;
  area?: number;
  state?: string;
  nbLevels?: number;
  plot?: {
    housingEstate?: {
      name?: string;
      region?: { name: string };
      department?: { name: string };
      arrondissement?: { name: string };
      place?: string;
    };
    TFnumber?: string;
    price?: number;
    acquiredYear?: number;
  };
}

type BuildingFeature = GeoJSON.Feature<Polygon, BuildingProperties>;
type BuildingData = GeoJSON.FeatureCollection<Polygon, BuildingProperties>;

// Types pour les intersections
interface Intersection {
  polygon1: any;
  polygon2: any;
  intersection: any;
  area: number;
  id: string;
}

// Props du composant
interface Map3DProps {
  initialViewState?: MapViewState;
  onBuildingClick?: (info: PickingInfo) => void;
}

const Map3D: React.FC<Map3DProps> = ({ 
  initialViewState = {
    longitude: 2.3522,
    latitude: 48.8566,
    zoom: 11,
    pitch: 45,
    bearing: 0
  },
  onBuildingClick 
}) => {
  // États
  const [viewState, setViewState] = useState<MapViewState>(initialViewState);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFeature | null>(null);
  const [selectedIntersection, setSelectedIntersection] = useState<Intersection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    batiments: true,
    intersections: true
  });
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [buildingsData, setBuildingsData] = useState<BuildingData>({
    type: 'FeatureCollection',
    features: []
  });

  const { toast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Sélecteurs Redux
  const isSearchActive = useSelector(selectSearch);
  const isLayersActive = useSelector(selectLayers);
  const currentOpenedMenu = useSelector(selectMenu);
  const selectedBuildings = useSelector(selectBuildings);
  const selectExcludeTypesFS = useSelector(selectExcludedTypes);
  const selectOverlapsFS = useSelector(selectOverlaps);

  // Références
  const deckRef = useRef<any>(null);

  // Conversion des données Redux vers le format GeoJSON
  useEffect(() => {
    const convertToGeoJSON = (buildings: any[]): BuildingData => {
      const features: BuildingFeature[] = buildings.map(building => {
        const geom = building.geom;
        let coordinates: number[][][] = [];

        if (geom.type.toLowerCase() === "multipolygon") {
          coordinates = geom.coordinates[0]; // Prendre le premier polygone pour la 3D
        } else if (geom.type.toLowerCase() === "polygon") {
          coordinates = geom.coordinates;
        }

        // Convertir les coordonnées [lat, lng] vers [lng, lat] pour DeckGL
        const deckGLCoordinates = coordinates.map(ring =>
          ring.map(coord => [coord[1], coord[0]])
        );

        return {
          type: 'Feature',
          properties: {
            id: building.id,
            height: building.nbLevels ? building.nbLevels * 3 : 10, // Hauteur approximative
            name: building.code || `Building ${building.id}`,
            color: [200, 100, 100] as [number, number, number],
            code: building.code,
            area: building.area,
            state: building.state,
            nbLevels: building.nbLevels,
            plot: building.plot
          },
          geometry: {
            type: 'Polygon',
            coordinates: [deckGLCoordinates[0]] // Prendre l'anneau extérieur pour l'extrusion
          }
        };
      });

      return {
        type: 'FeatureCollection',
        features
      };
    };

    if (selectedBuildings && selectedBuildings.length > 0) {
      setBuildingsData(convertToGeoJSON(selectedBuildings));
    }
  }, [selectedBuildings]);

  // Chargement des bâtiments
  const fetchAndFilterBuildings = async () => {
    const response = await dispatch(
      fetchBuildings({ 
        search: searchQuery, 
        excludeTypes: Array.isArray(selectExcludeTypesFS) ? selectExcludeTypesFS.join(',') : '' 
      })
    );
    
    if (response.type.includes("fulfilled")) {
      console.log("Buildings loaded successfully");
    }
  };

  useEffect(() => {
    fetchAndFilterBuildings();
  }, [searchQuery, selectExcludeTypesFS]);

  // Calcul des intersections (similaire à la 2D)
  const calculateIntersections = () => {
    if (!selectOverlapsFS || buildingsData.features.length < 2) {
      setIntersections([]);
      return;
    }

    // Implémentation simplifiée du calcul d'intersections
    // Dans une vraie implémentation, vous utiliseriez turf.js comme dans la 2D
    const intersectionsList: Intersection[] = [];
    
    // Logique de calcul d'intersections à implémenter
    console.log("Calcul des intersections 3D à implémenter");
    
    setIntersections(intersectionsList);
  };

  useEffect(() => {
    calculateIntersections();
  }, [buildingsData, selectOverlapsFS]);

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Contrôles de navigation
  const zoomIn = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 1, 20)
    }));
  };

  const zoomOut = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 1, 0)
    }));
  };

  const resetView = () => {
    setViewState(initialViewState);
  };

  // Recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = buildingsData.features.find(building => 
      building.properties.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      building.properties.id === searchQuery
    );
    
    if (found) {
      // Centrer la vue sur le bâtiment trouvé
      const coordinates = building.properties.geom?.coordinates || building.geometry.coordinates;
      if (coordinates && coordinates[0] && coordinates[0][0]) {
        const [lng, lat] = coordinates[0][0];
        setViewState(prev => ({
          ...prev,
          longitude: lng,
          latitude: lat,
          zoom: 16
        }));
      }
      
      setSelectedBuilding(found);
      toast({
        title: "Bâtiment trouvé",
        description: `Bâtiment ${found.properties.name} sélectionné.`
      });
    } else {
      toast({
        title: "Aucun résultat",
        description: "Aucun bâtiment ne correspond à votre recherche.",
        variant: "destructive"
      });
    }
  };

  // Suppression d'un bâtiment
  const handleDeleteBuilding = async () => {
    try {
      if (selectedBuilding) {
        const response = await dispatch(deleteBuilding(selectedBuilding.properties.id));
        
        if (response.type.includes("fulfilled")) {
          setConfirmPopupVisible(false);
          setSelectedBuilding(null);
          toast({
            title: "Bâtiment supprimé",
            description: `Bâtiment supprimé avec succès`
          });
          await fetchAndFilterBuildings();
        } else {
          setConfirmPopupVisible(false);
          toast({
            title: "Échec de la suppression",
            description: `Une erreur est survenue lors de la suppression`
          });
        }
      }
    } catch (err) {
      console.log("ERROR DELETING BUILDING", err);
      setConfirmPopupVisible(false);
      toast({
        title: "Erreur de suppression",
        description: `Une erreur inattendue s'est produite`
      });
    }
  };

  // Couches DeckGL
  const layers = [
    // Couche des bâtiments
    activeLayers.batiments && new GeoJsonLayer<BuildingProperties>({
      id: 'buildings',
      data: buildingsData,
      extruded: true,
      getElevation: (f: BuildingFeature) => f.properties.height,
      getFillColor: (f: BuildingFeature) => {
        if (selectedBuilding && f.properties.id === selectedBuilding.properties.id) {
          return [59, 130, 246]; // Bleu pour la sélection
        }
        return f.properties.color || [200, 200, 200];
      },
      pickable: true,
      onClick: (info: PickingInfo) => {
        if (info.object) {
          const building = info.object as BuildingFeature;
          setSelectedBuilding(building);
          setSelectedIntersection(null);
          
          if (onBuildingClick) {
            onBuildingClick(info);
          }
        }
      }
    }),
    
    // Couche des intersections (à implémenter avec une visualisation 3D)
    activeLayers.intersections && intersections.length > 0 && new GeoJsonLayer({
      id: 'intersections',
      data: {
        type: 'FeatureCollection',
        features: intersections.map(intersection => ({
          type: 'Feature',
          properties: {
            area: intersection.area,
            id: intersection.id
          },
          geometry: intersection.intersection
        }))
      },
      extruded: true,
      getElevation: 1, // Hauteur minimale pour la visibilité
      getFillColor: [255, 0, 0, 150], // Rouge semi-transparent
      pickable: true,
      onClick: (info: PickingInfo) => {
        if (info.object) {
          const intersection = intersections.find(i => i.id === (info.object as any).properties.id);
          if (intersection) {
            setSelectedIntersection(intersection);
            setSelectedBuilding(null);
          }
        }
      }
    })
  ].filter(Boolean);

  // Gestionnaire d'événements pour DeckGL
  const handleViewStateChange = ({ viewState }: { viewState: MapViewState }) => {
    setViewState(viewState);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* Carte DeckGL */}
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        getTooltip={({ object }: PickingInfo) => {
          if (object) {
            const building = object as BuildingFeature;
            return building.properties.name || 'Bâtiment';
          }
          return null;
        }}
      >
        <Map
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
        />
      </DeckGL>

      {/* ConfirmDialog */}
      <ConfirmDialog 
        isOpen={confirmPopupVisible}
        onClose={() => {
          setConfirmPopupVisible(false);
          setSelectedBuilding(null);
        }}
        onConfirm={handleDeleteBuilding}
        title="Confirmation de suppression"
        description="Êtes-vous sûr de vouloir supprimer ce bâtiment ?"
        variant="destructive"
        isLoading={false}
      />

      {/* Overlay d'information du bâtiment sélectionné */}
      {selectedBuilding && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-[1000] max-w-sm top-14 left-4"
        >
          <Card className="py-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedBuilding.properties.code || "Non spécifié"}</h3>
                  <p className="pb-2 text-sm text-slate-600 dark:text-slate-400">
                    SURFACE: {selectedBuilding.properties.area} ha
                  </p>
                  <p className="text-sm">Hauteur: {selectedBuilding.properties.height} m</p>
                  <p className="text-sm">État : {selectedBuilding.properties.state || "Non spécifié"}</p>
                  <p className="text-sm">Nombre de niveaux : {selectedBuilding.properties.nbLevels || "Non spécifié"}</p>
                  <p className="text-sm">Cité : {selectedBuilding.properties.plot?.housingEstate?.name || "Aucune"}</p>
                  
                  {selectedBuilding.properties.plot?.housingEstate?.region ? (
                    <ul className="p-2 list-none rounded bg-green-500/15">
                      <li className="text-sm">Région : {selectedBuilding.properties.plot.housingEstate.region.name}</li>
                      <li className="text-sm">Département : {selectedBuilding.properties.plot.housingEstate.department?.name || "Non spécifié"}</li>
                      <li className="text-sm">Arrondissement : {selectedBuilding.properties.plot.housingEstate.arrondissement?.name || "Non spécifié"}</li>
                    </ul>
                  ) : (
                    <div className="p-2 text-sm rounded bg-green-500/15">
                      Localisation non spécifiée
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedBuilding(null)}
                >
                  ×
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="cursor-pointer" 
                  onClick={() => {
                    dispatch(setCurrentPlot(selectedBuilding.properties));
                    navigate("/map/plot-edition", { state: { editingMode: true } });
                  }}
                >
                  Modifier les infos
                </Button>
                <Button 
                  size="sm" 
                  className="bg-red-400 cursor-pointer hover:bg-red-600" 
                  onClick={() => setConfirmPopupVisible(true)}
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overlay d'information de l'intersection sélectionnée */}
      {selectedIntersection && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-[1000] max-w-md top-14 left-4"
        >
          <Card className="py-2 border-red-300 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-red-700">Empiètement détecté (3D)</h3>
                  <p className="pb-2 text-sm text-slate-600 dark:text-slate-400">
                    Surface de l'empiètement: <strong>{selectedIntersection.area.toFixed(2)} m²</strong>
                  </p>
                  <p className="text-sm">Visualisation 3D de l'intersection entre bâtiments</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedIntersection(null)}
                >
                  ×
                </Button>
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

      {/* Barre de recherche */}
      <AnimatePresence>
        {isSearchActive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0}}
            className="absolute z-[1000] transform -translate-x-1/2 top-4 left-1/2 md:w-80 w-5/6"
          >
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Rechercher un bâtiment..."
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
            className="absolute z-[1000] left-4 top-14"
          >
            <Card className="py-1">
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Bâtiments 3D</span>
                    <Toggle
                      pressed={activeLayers.batiments}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, batiments: pressed})}
                      size="sm"
                    >
                      <Layers className="w-4 h-4" />
                    </Toggle>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Empiètements</span>
                    <Toggle
                      pressed={activeLayers.intersections}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, intersections: pressed})}
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

      {/* Menus */}
      {currentOpenedMenu === AvailableMenus.FILE && <FileMenu />}
      {currentOpenedMenu === AvailableMenus.EDIT && <EditionMenu />}
      {currentOpenedMenu === AvailableMenus.VIEW && <ViewMenu />}
      {currentOpenedMenu === AvailableMenus.EXPORT && <ExportMenu printControlRef={null} />}

      {/* Indicateur de coordonnées */}
      <div className="absolute z-[1000] px-2 py-1 text-xs text-white rounded bottom-5 right-20 bg-black/70">
        {viewState.longitude?.toFixed(4)}, {viewState.latitude?.toFixed(4)} | Zoom: {viewState.zoom} | Pitch: {viewState.pitch}°
      </div>

      {/* Barre d'outils principale */}
      <div className="absolute z-[1000] flex flex-col gap-2 top-14 right-4">
        <Button 
          onClick={toggleFullscreen} 
          size="icon" 
          variant="outline"
        >
          <Fullscreen className="w-4 h-4" />
        </Button>
        <Button 
          onClick={resetView} 
          size="icon" 
          variant="outline"
        >
          <Compass className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Map3D;