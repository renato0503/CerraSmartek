"use client";

import dynamic from "next/dynamic";

const MapPickerClient = dynamic(() => import("./MapPickerClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-xl bg-gray-100">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  ),
});

interface MapPickerProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  initialPosition?: [number, number];
  selectedPosition?: [number, number] | null;
}

export default function MapPicker(props: MapPickerProps) {
  return <MapPickerClient {...props} />;
}
