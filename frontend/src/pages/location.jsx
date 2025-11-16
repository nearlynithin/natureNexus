import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const reportIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Location({ reports = [] }) {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });

        const token = localStorage.getItem("token");
        try {
          await fetch("http://localhost:3000/location", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ latitude, longitude }),
          });
        } catch (err) {
          console.error("Failed to update location:", err);
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true },
    );
  }, []);

  if (coords.latitude === null) return <p>Getting your location...</p>;

  return (
    <div className="h-[400px] w-[400px] rounded-xl overflow-hidden shadow-md">
      <MapContainer
        center={[coords.latitude, coords.longitude]}
        zoom={15}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker
          position={[coords.latitude, coords.longitude]}
          icon={markerIcon}
        />

        {reports.map((r, i) => (
          <Marker
            key={i}
            position={[r.latitude, r.longitude]}
            icon={reportIcon}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default Location;
