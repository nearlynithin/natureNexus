import { useState } from "react";

export default function SightingReport() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition((pos) => {
        resolve({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
        });
      });
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !image) return;
    setLoading(true);

    const loc = await getLocation();
    setLocation(loc);

    const token = localStorage.getItem("token");

    const payload = {
      content,
      image, // dataURL string
      latitude: loc.lat,
      longitude: loc.long,
    };

    await fetch("http://localhost:3000/sightings/report", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    setContent("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto mt-10 p-6 bg-gray-900 rounded-xl">
      <h1 className="text-3xl font-bold text-green-400 mb-4">
        Report Wildlife Sighting
      </h1>

      <textarea
        className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700"
        rows="4"
        placeholder="Describe what you saw..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mt-3 text-gray-300"
      />

      {preview && (
        <img
          src={preview}
          alt=""
          className="mt-3 rounded-lg max-h-64 border border-green-400/30"
        />
      )}

      <button
        className="mt-4 px-6 py-2 bg-green-600 text-black rounded-lg font-semibold"
        disabled={loading}
        onClick={handleSubmit}
      >
        Submit Sighting
      </button>
    </div>
  );
}
