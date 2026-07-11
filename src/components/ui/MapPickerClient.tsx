"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapClickHandlerProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface MapPickerClientProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  initialPosition?: [number, number];
  selectedPosition?: [number, number] | null;
}

export default function MapPickerClient({
  onLocationSelect,
  initialPosition = [-23.5505, -46.6333],
  selectedPosition,
}: MapPickerClientProps) {
  const [center] = useState<[number, number]>(initialPosition);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        center={center}
        zoom={13}
        className="h-[400px] w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {selectedPosition && <Marker position={selectedPosition} />}
      </MapContainer>
    </div>
  );
}
