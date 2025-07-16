"use client";

import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const locations = [
  { name: "New York", lat: 40.7128, lng: -74.006, value: 20 },
  { name: "London", lat: 51.5072, lng: -0.1276, value: 15 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025, value: 30 },
  { name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 10 },
];

const WorldMap = () => {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc, idx) => (
        <CircleMarker
          key={idx}
          center={[loc.lat, loc.lng]}
          radius={loc.value / 2}
          pathOptions={{ color: "red" }}
        >
          <Tooltip>{loc.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default WorldMap;
