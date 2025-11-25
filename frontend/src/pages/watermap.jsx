
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function WaterMap() {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [allOverpassPoints, setAllOverpassPoints] = useState([]);
  const [userAddedPoints, setUserAddedPoints] = useState([]);


  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  useEffect(() => {
    mapRef.current = L.map("watermap-root").setView([12.9141, 74.8560], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    setMapReady(true);

    return () => {
      mapRef.current.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/water")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Loaded points from DB:", data.data);
          setUserAddedPoints(data.data);
        }
      })
      .catch(err => console.log("DB fetch error:", err));
  }, []);

  
  useEffect(() => {
    if (!mapReady) return;

    const overpassQuery = `
      [out:json];
      (
        node["natural"="water"](12.7,74.75,13.2,75.1);
        way["natural"="water"](12.7,74.75,13.2,75.1);
        node["water"="pond"](12.7,74.75,13.2,75.1);
        way["water"="pond"](12.7,74.75,13.2,75.1);
        node["water"="waterhole"](12.7,74.75,13.2,75.1);
        way["water"="waterhole"](12.7,74.75,13.2,75.1);
        way["waterway"](12.7,74.75,13.2,75.1);
      );
      out center;
    `;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    })
      .then((r) => r.json())
      .then((data) => {
        const points = [];
        (data.elements || []).forEach((el) => {
          let lat = null;
          let lon = null;
          if (el.type === "node") {
            lat = el.lat;
            lon = el.lon;
          } else if (el.type === "way" && el.center) {
            lat = el.center.lat;
            lon = el.center.lon;
          }
          if (lat && lon) {
            const label = el.tags?.natural || el.tags?.water || el.tags?.waterway || "Water Source";
            points.push({ name: label, lat, lon });
          }
        });
        setAllOverpassPoints(points);
      })
      .catch((err) => {
        console.error("Overpass fetch failed:", err);
      });
  }, [mapReady]);

 
  useEffect(() => {
    if (!mapReady) return;
    
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        mapRef.current.removeLayer(layer);
      }
    });

    allOverpassPoints.forEach((p) => {
      L.circleMarker([p.lat, p.lon], {
        radius: 6,
        color: "#0077cc",
        fillColor: "#00aaff",
        fillOpacity: 0.8,
      })
        .bindPopup(`<b>${p.name}</b>`)
        .addTo(mapRef.current);
    });

   
    userAddedPoints.forEach((p) => {
      L.marker([p.lat, p.lon])
        .bindPopup(`<b>${p.name}</b><br><small>DB stored</small>`)
        .addTo(mapRef.current);
    });

  }, [mapReady, allOverpassPoints, userAddedPoints]);

 
  useEffect(() => {
    if (!mapReady) return;
    const handler = (e) => {
      const name = prompt("Enter water body name:");
      if (!name) return;
      const newPoint = { name, lat: e.latlng.lat, lon: e.latlng.lng };

  
      fetch("http://localhost:3000/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPoint)
      });

      setUserAddedPoints(prev => [...prev, newPoint]);
      L.marker([newPoint.lat, newPoint.lon])
        .bindPopup(`<b>${newPoint.name}</b>`)
        .addTo(mapRef.current);
    };

    const addBtn = document.getElementById("wm-add-btn");
    const onAddBtn = () => {
      alert("Click on the map to add water point");
      mapRef.current.once("click", handler);
    };

    addBtn.addEventListener("click", onAddBtn);
    return () => {
      addBtn.removeEventListener("click", onAddBtn);
    };
  }, [mapReady]);
  useEffect(() => {
  if (!mapReady) return;

  const searchBtn = document.getElementById("wm-search-btn");
  const input = document.getElementById("wm-search-input");

  const onSearch = async () => {
    const query = input.value.trim();
    if (!query) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      mapRef.current.setView([lat, lon], 13);
      L.marker([lat, lon]).addTo(mapRef.current).bindPopup(`<b>${query}</b>`).openPopup();
    } else {
      alert("❌ Location not found");
    }
  };

  searchBtn.addEventListener("click", onSearch);

  return () => {
    searchBtn.removeEventListener("click", onSearch);
  };
}, [mapReady]);


  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ textAlign: "center", color: "#0a3d62" }}><b>Forest Water Resource Finder</b></h2>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
        <input
          id="wm-search-input"
          type="text"
          placeholder="Search a place"
          style={{ width: 320, padding: 10, borderRadius: 8, border: "1px solid #aaa" }}
        />
        <button id="wm-search-btn" style={{ padding: "10px 16px", borderRadius: 8, background: "#0a3d62", color: "white", border: "none" }}>
          Search
        </button>
        <button id="wm-add-btn" style={{ padding: "10px 16px", borderRadius: 8, background: "green", color: "white", border: "none" }}>
          Add Water Body
        </button>
      </div>

      <div id="watermap-root" style={{ height: 600, borderRadius: 10 }} />
    </div>
  );
}
