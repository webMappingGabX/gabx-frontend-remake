import React, { useEffect, useState, useRef } from "react";
import { DeckGL } from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import { GeoJsonLayer } from "@deck.gl/layers";
import type { FeatureCollection, Polygon } from "geojson";
import { motion, AnimatePresence } from "framer-motion";
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
import type { PickingInfo, MapViewState } from '@deck.gl/core';

// Style de fond raster OSM
const CUSTOM_STYLE = {
  version: 8,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    },
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster",
      source: "osm-raster",
    },
  ],
};

// Types pour les bâtiments (identique à Map2D)
interface BuildingProperties {
  id: string;
  height: number;
  name?: string;
  color?: [number, number, number];
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
  coordinates?: [number, number][][];
  type?: string;
  geom?: any;
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

export default function OSMBuildingsMap() {
  // États
  const [buildingsData, setBuildingsData] = useState<BuildingData>({
    type: 'FeatureCollection',
    features: []
  });
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
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: 11.519596,
    latitude: 3.868177,
    zoom: 16,
    pitch: 45,
    bearing: 0,
  });

  const { toast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Sélecteurs Redux (identique à Map2D)
  const isSearchActive = useSelector(selectSearch);
  const isLayersActive = useSelector(selectLayers);
  const currentOpenedMenu = useSelector(selectMenu);
  const selectedBuildings = useSelector(selectBuildings);
  const selectExcludeTypesFS = useSelector(selectExcludedTypes);
  const selectOverlapsFS = useSelector(selectOverlaps);

  // Références
  const deckRef = useRef<any>(null);

  // Conversion des données Redux vers le format GeoJSON pour DeckGL (identique à Map2D)
  useEffect(() => {
    const convertToGeoJSON = (buildings: any[]): BuildingData => {
      const features: BuildingFeature[] = [];

      buildings.forEach(building => {
        const geom = building.geom;
        
        if (!geom) return;

        if (geom.type.toLowerCase() === "multipolygon") {
          // Pour les multipolygones, créer un feature par polygone
          geom.coordinates.forEach((polygonCoords: any, index: number) => {
            const coordinates = polygonCoords.map((ring: any) =>
              ring.map((coord: any) => {
                // Convertir [lat, lng] vers [lng, lat] pour DeckGL
                if (Array.isArray(coord) && coord.length >= 2) {
                  return [coord[1], coord[0]]; // [lng, lat]
                }
                return coord;
              })
            );

            features.push({
              type: 'Feature',
              properties: {
                id: building.id,
                height: building.nbLevels ? building.nbLevels * 3 : 10,
                name: building.code || `Building ${building.id}`,
                color: [200, 100, 100] as [number, number, number],
                code: building.code,
                area: building.area,
                state: building.state,
                nbLevels: building.nbLevels,
                plot: building.plot,
                coordinates: polygonCoords,
                type: "multipolygon",
                geom: building.geom
              },
              geometry: {
                type: 'Polygon',
                coordinates: coordinates
              }
            });
          });
        } else if (geom.type.toLowerCase() === "polygon") {
          // Pour les polygones simples
          const coordinates = geom.coordinates.map((ring: any) =>
            ring.map((coord: any) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                return [coord[1], coord[0]]; // [lng, lat]
              }
              return coord;
            })
          );

          features.push({
            type: 'Feature',
            properties: {
              id: building.id,
              height: building.nbLevels ? building.nbLevels * 3 : 10,
              name: building.code || `Building ${building.id}`,
              color: [200, 100, 100] as [number, number, number],
              code: building.code,
              area: building.area,
              state: building.state,
              nbLevels: building.nbLevels,
              plot: building.plot,
              coordinates: geom.coordinates,
              type: "polygon",
              geom: building.geom
            },
            geometry: {
              type: 'Polygon',
              coordinates: coordinates
            }
          });
        }
        // Gérer autres types de géométries si nécessaire (linestring, point, etc.)
        else if (geom.type.toLowerCase() === "multilinestring") {
          console.log("Multilinestring ignoré pour la 3D:", building.id);
        } else if (geom.type.toLowerCase() === "linestring") {
          console.log("Linestring ignoré pour la 3D:", building.id);
        } else if (geom.type.toLowerCase() === "multipoint") {
          console.log("Multipoint ignoré pour la 3D:", building.id);
        } else if (geom.type.toLowerCase() === "point") {
          console.log("Point ignoré pour la 3D:", building.id);
        } else {
          console.warn("Type de géométrie non supporté pour la 3D:", geom.type, building.id);
        }
      });

      console.log(`✅ ${features.length} bâtiments convertis pour l'affichage 3D`);
      return {
        type: 'FeatureCollection',
        features
      };
    };

    if (selectedBuildings && selectedBuildings.length > 0) {
      const geoJSONData = convertToGeoJSON(selectedBuildings);
      setBuildingsData(geoJSONData);
      
      // Ajuster la vue pour montrer tous les bâtiments
      if (geoJSONData.features.length > 0) {
        // Calculer les bounds approximatives basées sur le premier bâtiment
        const firstFeature = geoJSONData.features[0];
        if (firstFeature.geometry.coordinates[0] && firstFeature.geometry.coordinates[0][0]) {
          const [lng, lat] = firstFeature.geometry.coordinates[0][0];
          setViewState(prev => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            zoom: 16
          }));
        }
      }
    } else {
      // Réinitialiser si aucun bâtiment
      setBuildingsData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [selectedBuildings]);

  // Chargement des bâtiments (identique à Map2D)
  const fetchAndFilterBuildings = async () => {
    const response = await dispatch(
      fetchBuildings({ 
        search: searchQuery, 
        excludeTypes: Array.isArray(selectExcludeTypesFS) ? selectExcludeTypesFS.join(',') : '' 
      })
    );
    
    if (response.type.includes("fulfilled")) {
      console.log("Buildings chargés avec succès");
    }
  };

  useEffect(() => {
    fetchAndFilterBuildings();
  }, [searchQuery, selectExcludeTypesFS]);

  // Calcul des intersections (identique à Map2D)
  const calculateIntersections = () => {
    if (!selectOverlapsFS || buildingsData.features.length < 2) {
      setIntersections([]);
      return;
    }

    // Implémentation simplifiée - identique à Map2D
    const intersectionsList: Intersection[] = [];
    console.log("Calcul des intersections pour", buildingsData.features.length, "bâtiments");
    
    // Logique de calcul d'intersections à implémenter avec turf.js
    // Pour l'instant, on laisse vide comme dans Map2D
    
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
    setViewState({
      longitude: 11.519596,
      latitude: 3.868177,
      zoom: 16,
      pitch: 45,
      bearing: 0,
    });
  };

  // Recherche (identique à Map2D)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = buildingsData.features.find(building => 
      building.properties.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      building.properties.id === searchQuery ||
      building.properties.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (found) {
      // Centrer la vue sur le bâtiment trouvé
      const coordinates = found.geometry.coordinates;
      if (coordinates && coordinates[0] && coordinates[0][0]) {
        const [lng, lat] = coordinates[0][0];
        setViewState(prev => ({
          ...prev,
          longitude: lng,
          latitude: lat,
          zoom: 18
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

  // Suppression d'un bâtiment (identique à Map2D)
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

  // Couches DeckGL pour l'affichage 3D
  const layers = [
    // Couche principale des bâtiments (identique aux données Map2D)
    activeLayers.batiments && new GeoJsonLayer<BuildingProperties>({
      id: 'buildings-3d',
      data: buildingsData,
      extruded: true,
      wireframe: true, // Contours visibles
      filled: true,
      getElevation: (f: BuildingFeature) => f.properties.height,
      getFillColor: (f: BuildingFeature) => {
        if (selectedBuilding && f.properties.id === selectedBuilding.properties.id) {
          return [59, 130, 246, 220]; // Bleu pour la sélection
        }
        return [...(f.properties.color || [200, 100, 100]), 200];
      },
      getLineColor: [0, 0, 0, 255], // Contours noirs bien visibles
      getLineWidth: 2,
      pickable: true,
      onClick: (info: PickingInfo) => {
        if (info.object) {
          const building = info.object as BuildingFeature;
          setSelectedBuilding(building);
          setSelectedIntersection(null);
        }
      },
    }),
    
    // Couche des intersections
    activeLayers.intersections && intersections.length > 0 && new GeoJsonLayer({
      id: 'intersections-3d',
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
      getElevation: 3,
      getFillColor: [255, 0, 0, 180],
      getLineColor: [255, 0, 0, 255],
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
      {/* Carte DeckGL avec les mêmes données que Map2D */}
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        getTooltip={({ object }: PickingInfo) => {
          if (object) {
            const building = object as BuildingFeature;
            return {
              html: `
                <div class="p-2 bg-white border border-gray-300 rounded shadow-lg">
                  <strong>${building.properties.name || 'Bâtiment'}</strong><br/>
                  <div class="text-xs mt-1">
                    Code: ${building.properties.code || 'N/A'}<br/>
                    Hauteur: ${building.properties.height}m<br/>
                    Niveaux: ${building.properties.nbLevels || 'N/A'}<br/>
                    Surface: ${building.properties.area || 'N/A'} ha
                  </div>
                </div>
              `
            };
          }
          return null;
        }}
      >
        <Map
          mapStyle={CUSTOM_STYLE}
          style={{ width: "100%", height: "100%" }}
          reuseMaps={true}
        />
      </DeckGL>

      {/* ConfirmDialog (identique à Map2D) */}
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

      {/* Overlay d'information du bâtiment sélectionné (identique à Map2D) */}
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

      {/* Indicateur de nombre de bâtiments */}
      {buildingsData.features.length > 0 && (
        <div className="absolute z-[1000] px-3 py-2 text-sm text-white rounded top-4 left-4 bg-black/70">
          🏗️ {buildingsData.features.length} bâtiment(s) 3D
        </div>
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

      {/* Barre de recherche (identique à Map2D) */}
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

      {/* Contrôles de couches (identique à Map2D) */}
      <AnimatePresence>
        {isLayersActive && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute z-[1000] left-4 top-20"
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

      {/* Menus (identique à Map2D) */}
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
}