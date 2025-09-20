import React from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import type { PickingInfo, MapViewState } from '@deck.gl/core';
import type { FeatureCollection, Polygon } from 'geojson';


// Types Deck.gl courants
/*import type {
  Layer,
  PickingInfo,
  ViewState,
  MapViewState,
  LayerProps
} from '@deck.gl/core';*/

// Types pour les couches
/*import type {
  GeoJsonLayerProps,
  ScatterplotLayerProps,
  ArcLayerProps
} from '@deck.gl/layers';*/

// Types GeoJSON
/*import type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Point
} from 'geojson';*/

// Définition des types pour vos données
interface BuildingProperties {
  height: number;
  name?: string;
  color?: [number, number, number];
}

type BuildingFeature = GeoJSON.Feature<Polygon, BuildingProperties>;
type BuildingData = GeoJSON.FeatureCollection<Polygon, BuildingProperties>;

// Données d'exemple typées
const buildingData: BuildingData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { 
        height: 50, 
        name: 'Building A',
        color: [200, 100, 100] as [number, number, number]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.3522, 48.8566], 
          [2.3572, 48.8566], 
          [2.3572, 48.8616], 
          [2.3522, 48.8616],
          [2.3522, 48.8566]
        ]]
      }
    }
  ]
};

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
  // Couches typées
  const layers = [
    new GeoJsonLayer<BuildingProperties>({
      id: 'buildings',
      data: buildingData,
      extruded: true,
      getElevation: (f: BuildingFeature) => f.properties.height,
      getFillColor: (f: BuildingFeature) => f.properties.color || [200, 200, 200],
      pickable: true,
      onClick: (info: PickingInfo) => {
        if (onBuildingClick) {
          onBuildingClick(info);
        }
      }
    })
  ];

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
      getTooltip={({ object }: PickingInfo) => 
        object && (object as BuildingFeature).properties?.name
      }
    >
      <Map
        mapStyle="https://demotiles.maplibre.org/style.json"
        style={{ width: '100%', height: '100%' }}
      />
    </DeckGL>
  );
};

export default Map3D;