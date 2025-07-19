"use client";

import React, { useEffect, useState } from "react";

const locations = [
  { name: "New York", lat: 40.7128, lng: -74.006, value: 20 },
  { name: "London", lat: 51.5072, lng: -0.1276, value: 15 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025, value: 30 },
  { name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 10 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, value: 12 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, value: 18 },
];

const WorldMap = () => {
  const [isClient, setIsClient] = useState(false);
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamic import of map components
    const loadMap = async () => {
      try {
        const { MapContainer, TileLayer, CircleMarker, Tooltip } = await import("react-leaflet");
        
        const MapComp: React.FC = () => (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc, idx) => (
              <CircleMarker
                key={idx}
                center={[loc.lat, loc.lng]}
                radius={Math.max(5, loc.value / 2)}
                pathOptions={{ 
                  color: "#3b82f6", 
                  fillColor: "#60a5fa", 
                  fillOpacity: 0.6,
                  weight: 2 
                }}
              >
                <Tooltip>
                  <div>
                    <strong>{loc.name}</strong><br />
                    Users: {loc.value}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        );
        
        setMapComponent(() => MapComp);
      } catch (error) {
        console.error('Failed to load map:', error);
      }
    };

    loadMap();
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading world map...</p>
        </div>
      </div>
    );
  }

  if (!MapComponent) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="w-full h-64 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
            <div>
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600 mb-4">User Location Distribution</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {locations.map((loc, idx) => (
                  <div key={idx} className="flex justify-between bg-white px-2 py-1 rounded">
                    <span>{loc.name}</span>
                    <span className="font-bold text-blue-600">{loc.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <MapComponent />;
};

export default WorldMap;
