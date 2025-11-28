import { useEffect, useState } from "react";
import Location from "./location";
import ImageViewer from "../components/image";
import "leaflet/dist/leaflet.css";
import AlertAnalytics from "../components/AlertAnalytics";

function Home() {
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [reportImage, setReportImage] = useState(null);
  const [reportPreview, setReportPreview] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  const handleReportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReportImage(reader.result);
      setReportPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleReportSubmit = async () => {
    if (!reportContent.trim() || !reportImage) return;
    setReportLoading(true);
    const loc = await getLocation();
    const token = localStorage.getItem("token");
    const payload = {
      content: reportContent,
      image: reportImage,
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
    setReportLoading(false);
    setReportContent("");
    setReportImage(null);
    setReportPreview(null);
    setShowReportModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🌿</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Nature Nexus
              </span>
            </a>
            <div className="flex gap-8 items-center">
              <a
                href="location"
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Location
              </a>
              <a
                href="image"
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Recognition
              </a>
              <a
                href="message"
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Messages
              </a>
              <a
                href="report"
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Report
              </a>
              <a
                href="watermap"
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Water Map
              </a>
              <div className="flex gap-3 ml-4">
                <a
                  href="login"
                  className="px-4 py-2 text-slate-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  Login
                </a>
                <a
                  href="register"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-12 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Community Wildlife Monitoring
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Report Wildlife
              <br />
              Sightings Instantly
            </h1>

            <p className="text-xl text-emerald-50 mb-8 leading-relaxed max-w-2xl">
              Join our community in protecting endangered species. Your reports
              help rangers and conservationists track wildlife patterns and
              respond to threats in real-time.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>Report Sighting</span>
                <span>→</span>
              </button>
              <a
                href="location"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                <span>View Map</span>
              </a>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Recent Alerts
                </h2>
                <p className="text-slate-600">
                  Live updates from the community
                </p>
              </div>
              <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-red-700 font-medium text-sm">
                  {alerts.length} Active
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-slate-200"
                >
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🚨</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">
                            Animal Sighting Alert
                          </h3>
                          <p className="text-slate-700 mb-2">
                            Reported by{" "}
                            <span className="font-semibold text-emerald-700">
                              {a.senderName}
                            </span>
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(a.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                        <ImageViewer image={a.image} boxes={a.boxes || []} />
                      </div>

                      <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 h-80">
                        <Location
                          reports={[
                            { latitude: a.latitude, longitude: a.longitude },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features Grid */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Explore Features
            </h2>
            <p className="text-slate-600 text-lg">
              Everything you need for wildlife conservation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="location"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-8 border border-slate-200 hover:border-emerald-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Location Tracking
              </h3>
              <p className="text-slate-600">
                Track wildlife sightings on an interactive map in real-time
              </p>
            </a>

            <a
              href="image"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-8 border border-slate-200 hover:border-emerald-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📸</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI Recognition
              </h3>
              <p className="text-slate-600">
                Identify species instantly using advanced computer vision
              </p>
            </a>

            <a
              href="message"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-8 border border-slate-200 hover:border-emerald-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Community Chat
              </h3>
              <p className="text-slate-600">
                Connect with rangers, experts, and fellow enthusiasts
              </p>
            </a>
          </div>
        </section>

        {/* Profile Section */}
        {user && (
          <section>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Your Profile</h2>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Name
                    </label>
                    <p className="text-xl font-semibold text-slate-900 mt-1">
                      {user.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Phone
                      </label>
                      <p className="text-lg text-slate-900 mt-1">
                        {user.phone}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Role
                      </label>
                      <p className="text-lg text-slate-900 mt-1">
                        <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                          {user.role}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Address
                    </label>
                    <p className="text-lg text-slate-900 mt-1">
                      {user.address || "Not provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Latitude
                      </label>
                      <p className="text-lg font-mono text-slate-900 mt-1">
                        {user.latitude || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Longitude
                      </label>
                      <p className="text-lg font-mono text-slate-900 mt-1">
                        {user.longitude || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 h-80">
                  <Location />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Analytics Section */}
      {
        <div className="mb-12">
          <AlertAnalytics alerts={alerts} />
        </div>
      }

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🌿</span>
                </div>
                <span className="text-xl font-bold">Nature Nexus</span>
              </div>
              <p className="text-slate-400">
                Protecting wildlife through community collaboration
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <div className="space-y-2 text-slate-400">
                <a
                  href="report"
                  className="block hover:text-white transition-colors"
                >
                  Report Sightings
                </a>
                <a
                  href="location"
                  className="block hover:text-white transition-colors"
                >
                  Location Map
                </a>
                <a
                  href="image"
                  className="block hover:text-white transition-colors"
                >
                  AI Recognition
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <div className="space-y-2 text-slate-400">
                <a
                  href="message"
                  className="block hover:text-white transition-colors"
                >
                  Messenger
                </a>
                <a
                  href="watermap"
                  className="block hover:text-white transition-colors"
                >
                  Water Sources
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <div className="space-y-2 text-slate-400">
                <a
                  href="login"
                  className="block hover:text-white transition-colors"
                >
                  Login
                </a>
                <a
                  href="register"
                  className="block hover:text-white transition-colors"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Nature Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Report Wildlife Sighting
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-4 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                  rows="4"
                  placeholder="Describe what you saw... (species, behavior, location details)"
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Photo Evidence
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReportFile}
                    className="hidden"
                    id="report-file-input"
                  />
                  <label htmlFor="report-file-input" className="cursor-pointer">
                    {reportPreview ? (
                      <img
                        src={reportPreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="py-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">📸</span>
                        </div>
                        <p className="text-slate-600 font-medium mb-2">
                          Click to upload image
                        </p>
                        <p className="text-sm text-slate-500">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={
                    reportLoading || !reportContent.trim() || !reportImage
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {reportLoading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
