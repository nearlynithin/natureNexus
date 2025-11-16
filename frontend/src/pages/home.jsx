import { useEffect, useState } from "react";
import Location from "./location";

import "leaflet/dist/leaflet.css";

function Home() {
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch current user profile
    fetch("http://localhost:3000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Failed to fetch user:", err));

    // WebSocket for alerts
    const ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "animal_sighting") {
        setAlerts((prev) => [...prev, data]);
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-300">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-green-800">
              Nature Nexus
            </a>
            <div className="flex gap-6">
              <a
                href="location"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                Location
              </a>
              <a
                href="image"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                Image Recognition
              </a>
              <a
                href="message"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                Messenger
              </a>
              <a
                href="report"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                Report
              </a>
              <a
                href="login"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                Login
              </a>
              <a
                href="register"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Report Highlight */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-4xl font-bold text-green-800 mb-3">
              Report Wildlife Sightings
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              Help protect wildlife by reporting animal sightings in your area.
              Your reports help rangers and conservationists track and protect
              endangered species.
            </p>
            <a
              href="report"
              className="inline-block bg-green-600 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
            >
              Report a Sighting Now
            </a>
          </div>
        </div>
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-green-900 mb-6">
              Recent Alerts
            </h2>

            <div className="space-y-6">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-200"
                >
                  <div className="p-5 border-b border-gray-100 bg-red-50">
                    <p className="text-lg font-semibold text-red-700">
                      Animal Sighting Reported
                    </p>
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium">Reported by:</span>{" "}
                      {a.senderName}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4">
                    <Location
                      reports={[
                        { latitude: a.latitude, longitude: a.longitude },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        )}
        {/* Other Features */}
        <div>
          <h2 className="text-2xl font-semibold text-green-800 mb-4 text-center">
            More Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="location"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow hover:scale-105 transform duration-200"
            >
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                📍 Location
              </h3>
              <p className="text-gray-600">Track and share your location</p>
            </a>
            <a
              href="image"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow hover:scale-105 transform duration-200"
            >
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                📸 Image Recognition
              </h3>
              <p className="text-gray-600">Identify wildlife species with AI</p>
            </a>
            <a
              href="message"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow hover:scale-105 transform duration-200"
            >
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                💬 Messenger
              </h3>
              <p className="text-gray-600">
                Connect with rangers and enthusiasts
              </p>
            </a>
          </div>
        </div>
        {/* Profile Section */}
        {user && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* User Info */}
              <div className="space-y-3 text-center md:text-left">
                <h2 className="text-3xl font-bold text-green-800">
                  {user.name}
                </h2>
                <p className="text-gray-700">
                  <span className="font-semibold">Phone:</span> {user.phone}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Address:</span>{" "}
                  {user.address || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Latitude:</span>{" "}
                  {user.latitude || "N/A"} <br />
                  <span className="font-semibold">Longitude:</span>{" "}
                  {user.longitude || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Role:</span> {user.role}
                </p>
              </div>

              {/* Map */}
              <div className="flex justify-center md:justify-end">
                <Location />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
