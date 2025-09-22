import React, { useEffect, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import { GeoJsonLayer } from "@deck.gl/layers";
import osmtogeojson from "osmtogeojson";
import type { FeatureCollection } from "geojson";

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

export default function OSMBuildingsMap() {
  const [buildings, setBuildings] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les bâtiments OSM via Overpass
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        
        // Bbox correcte: [minLat, minLon, maxLat, maxLon]
        //const bbox = "48.85,2.34,48.86,2.36";
        const bbox = "3.868177, 11.519596,3.869177, 11.520596";
        
        // Définir une bbox par défaut (Yaoundé centre) si zoom <= 12
        // Sinon, calculer la bbox à partir de la vue courante (window/maplibre)
        // Pour cela, on va utiliser la position de la carte si possible
        // Mais ici, on va utiliser une bbox statique si on n'a pas accès à la vue courante
        // Pour une vraie interaction, il faudrait synchroniser la bbox avec la vue DeckGL/Maplibre

        // Valeurs par défaut (Yaoundé centre, petite zone)
        /*let bbox = "3.8677,11.5186,3.8697,11.5206"; // [minLat,minLon,maxLat,maxLon]

        // Tenter d'utiliser la vue courante si zoom > 12
        // On ne peut pas accéder directement à la vue DeckGL ici, donc on peut utiliser window pour obtenir la carte si elle existe
        // Pour une vraie intégration, il faudrait lever la bbox via un prop ou un état partagé
        // Ici, on tente d'utiliser la map Maplibre si elle est accessible
        let zoom = 16; // valeur par défaut
        try {
          // @ts-ignore
          const map = window?.deckMapInstance || window?.maplibreMap;
          if (map && typeof map.getZoom === "function" && typeof map.getBounds === "function") {
            zoom = map.getZoom();
            console.log("CURRENT ZOOM", zoom);
            if (zoom > 12) {
              const bounds = map.getBounds();
              // Maplibre retourne bounds sous forme { _ne: {lat, lng}, _sw: {lat, lng} }
              const minLat = bounds._sw.lat;
              const minLon = bounds._sw.lng;
              const maxLat = bounds._ne.lat;
              const maxLon = bounds._ne.lng;
              bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
            }
          }
        } catch (e) {
          // fallback: garder bbox par défaut
        }*/

        // Requête Overpass simplifiée et corrigée
        const query = `
          [out:json][timeout:25];
          (
            way["building"](${bbox});
            relation["building"](${bbox});
          );
          out body;
          >;
          out skel qt;
        `;

        const url = "https://overpass-api.de/api/interpreter";
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Convertir le JSON Overpass en GeoJSON
        const geojson = osmtogeojson(data) as FeatureCollection;
        setBuildings(geojson);
        
      } catch (err) {
        console.error("Erreur lors du chargement des bâtiments:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Layer des bâtiments en 3D
  const buildingsLayer = buildings && new GeoJsonLayer({
    id: "osm-buildings",
    data: buildings,
    extruded: true,
    wireframe: false,
    filled: true,
    getFillColor: (f: any) => {
      // Gestion des propriétés manquantes
      const properties = f.properties || {};
      const height = parseFloat(properties.height) || parseFloat(properties['height:value']) || 10;
      
      return height > 15 ? [255, 100, 100, 200] : [180, 180, 200, 200];
    },
    getLineColor: [0, 0, 0, 100],
    getElevation: (f: any) => {
      const properties = f.properties || {};
      const height = parseFloat(properties.height) || parseFloat(properties['height:value']) || 5;
      return height * 1.2;
    },
    pickable: true,
    onClick: (info) => {
      if (info.object) {
        console.log("Bâtiment cliqué:", info.object.properties);
      }
    },
  });

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <div>Chargement des bâtiments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        color: "red" 
      }}>
        <div>Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <DeckGL
        initialViewState={{
          /*longitude: 2.3522,
          latitude: 48.8566,
          zoom: 15,*/
          longitude: 11.519596,
          latitude: 3.868177,
          zoom: 16,
          pitch: 45,
          bearing: 0,
        }}
        controller={true}
        layers={buildingsLayer ? [buildingsLayer] : []}
        getTooltip={({ object }) => 
          object && {
            html: `
              <div style="padding: 5px; background: white; border-radius: 3px;">
                <strong>Bâtiment</strong><br/>
                Hauteur: ${object.properties?.height || 'inconnue'}m<br/>
                Type: ${object.properties?.building || 'inconnu'}
              </div>
            `
          }
        }
      >
        <Map
          mapStyle={CUSTOM_STYLE}
          style={{ width: "100%", height: "100%" }}
          reuseMaps={true}
        />
      </DeckGL>
    </div>
  );
}

/*import React, { useEffect, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import { GeoJsonLayer } from "@deck.gl/layers";
import osmtogeojson from "osmtogeojson";

// Style de fond raster OSM
const CUSTOM_STYLE = {
  version: 8,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
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

export default function OSMBuildingsMap() {
  const [buildings, setBuildings] = useState<any>(null);

  // Charger les bâtiments OSM via Overpass
  useEffect(() => {
    const fetchBuildings = async () => {
      // Exemple : Paris centre, bbox [minLon, minLat, maxLon, maxLat]
      const bbox = [2.34, 48.85, 2.36, 48.86]; 
      const query = `
        [out:json];
        (
          way["building"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});
          relation["building"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});
        );
        out body;
        >;
        out skel qt;
      `;

      const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
      const response = await fetch(url);
      const data = await response.json();

      // Convertir le JSON Overpass en GeoJSON
      const geojson = osmtogeojson(data);
      setBuildings(geojson);
    };

    fetchBuildings();
  }, []);

  // Layer des bâtiments en 3D
  const buildingsLayer =
    buildings &&
    new GeoJsonLayer({
      id: "osm-buildings",
      data: buildings,
      extruded: true,
      wireframe: true,
      filled: true,
      getFillColor: (f: any) => {
        const h = f.properties.height || 10;
        return h > 15 ? [255, 100, 100, 200] : [180, 180, 200, 200];
      },
      getElevation: (f: any) => (f.properties.height || 5) * 1.2,
      pickable: true,
      onClick: (info) => {
        if (info.object) {
          console.log("Bâtiment cliqué:", info.object.properties);
        }
      },
    });

  return (
    <DeckGL
      initialViewState={{
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 16,
        pitch: 45,
        bearing: 0,
      }}
      controller={true}
      layers={buildings ? [buildingsLayer] : []}
    >
      <Map
        mapStyle={CUSTOM_STYLE}
        style={{ width: "100%", height: "100vh" }}
      />
    </DeckGL>
  );
}*/


/*import React from "react";
import { DeckGL } from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import { GeoJsonLayer } from "@deck.gl/layers";

// Fond raster OSM
const CUSTOM_STYLE = {
  version: 8,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
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

// Exemple : petits bâtiments GeoJSON gratuits (Paris)
// 👉 tu peux remplacer par n’importe quel GeoJSON de bâtiments OSM exportés
const sampleBuildings = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { height: 20, type: "residential" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.3510, 48.8566],
            [2.3515, 48.8566],
            [2.3515, 48.8570],
            [2.3510, 48.8570],
            [2.3510, 48.8566],
          ],
        ],
      },
    },
  ],
};

export default function OSMBuildingsMap() {
  const buildingsLayer = new GeoJsonLayer({
    id: "osm-buildings",
    data: sampleBuildings,
    extruded: true,
    wireframe: true,
    filled: true,
    getFillColor: (f: any) => {
      const h = f.properties.height || 10;
      return h > 15 ? [255, 100, 100, 200] : [180, 180, 200, 200];
    },
    getElevation: (f: any) => (f.properties.height || 5) * 1.2,
    pickable: true,
    onClick: (info) => {
      if (info.object) {
        console.log("Bâtiment cliqué:", info.object.properties);
      }
    },
  });

  return (
    <DeckGL
      initialViewState={{
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 16,
        pitch: 45,
        bearing: 0,
      }}
      controller={true}
      layers={[buildingsLayer]}
    >
      <Map
        mapStyle={CUSTOM_STYLE}
        style={{ width: "100%", height: "100vh" }}
      />
    </DeckGL>
  );
}*/


// import React, { useRef, useEffect } from 'react';
// import { DeckGL } from '@deck.gl/react';
// import { Map } from 'react-map-gl/maplibre';
// import * as OSMBuildings from 'osmbuildings';

// import 'osmbuildings/dist/osmbuildings.css';

// function useOSMBuildings() {
//   const mapRef = useRef<any>();
//   const osmbRef = useRef<any>();

//   useEffect(() => {
//     if (!mapRef.current) return;

//     const map = mapRef.current.getMap();
//     osmbRef.current = new OSMBuildings(map);

//     // Configuration des bâtiments
//     /*osmbRef.current.setStyle({
//       color: function(feature: any) {
//         // Couleur basée sur la hauteur
//         const height = feature.properties.height || 10;
//         return height > 20 ? '#ff9999' : '#cccccc';
//       },
//       roofColor: function(feature: any) {
//         return '#aa5555';
//       },
//       opacity: 0.9
//     });*/
//     const osmb = osmbRef.current;
//     osmb.setStyle({
//         color: function(feature: any) {
//           // Couleur selon le type de bâtiment
//           const type = feature.properties.type;
//           switch(type) {
//             case 'commercial': return '#ff6666';
//             case 'residential': return '#66aaff';
//             case 'industrial': return '#aaaaaa';
//             default: return '#cccccc';
//           }
//         },
//         roofColor: function(feature: any) {
//           return '#333333';
//         },
//         height: function(feature: any) {
//           // Exagération de la hauteur pour meilleure visibilité
//           return (feature.properties.height || 5) * 1.2;
//         },
//         opacity: 0.8
//       });

//       map.on('click', (e: any) => {
//         const features = osmb.getFeatures(e.point);
//         if (features.length > 0) {
//           console.log('Bâtiment cliqué:', features[0].properties);
//         }
//       });
    
//       // Survol des bâtiments
//       map.on('mousemove', (e: any) => {
//         const features = osmb.getFeatures(e.point);
//         map.getCanvas().style.cursor = features.length ? 'pointer' : '';
//       });
//     return () => {
//       if (osmbRef.current) {
//         osmbRef.current.destroy();
//       }
//     };
//   }, []);

//   return mapRef;
// }

// const CUSTOM_STYLE = {
//     version: 8,
//     sources: {
//       'osm-raster': {
//         type: 'raster',
//         tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
//         tileSize: 256
//       }
//     },
//     layers: [{
//       id: 'osm-raster',
//       type: 'raster',
//       source: 'osm-raster'
//     }]
//   };

// export default function OSMBuildingsMap() {
//   const mapRef = useOSMBuildings();

//   return (
//     <DeckGL
//       initialViewState={{
//         longitude: 2.3522,
//         latitude: 48.8566,
//         zoom: 15,
//         pitch: 45,
//         bearing: 0
//       }}
//       controller={true}
//     >
//       <Map
//         ref={mapRef}
//         mapStyle={CUSTOM_STYLE}
//         //mapStyle="https://tiles.maptiler.com/maps/basic/style.json"
//         style={{ width: '100%', height: '100vh' }}
//       />
//     </DeckGL>
//   );
// }