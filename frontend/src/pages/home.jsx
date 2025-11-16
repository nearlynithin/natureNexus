import { useEffect, useState } from "react";

function Home() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full">
      <div className="w-full max-w-xl mt-4 px-4">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="w-full p-3 mb-3 bg-red-700/20 border border-red-600 rounded-lg text-left"
          >
            <p className="font-semibold">Animal sighting reported</p>
            <p>Reported by: {a.senderName}</p>
            <p>
              Location: {a.latitude}, {a.longitude}
            </p>
            <p className="text-xs opacity-70">
              {new Date(a.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <h1 className="text-4xl font-bold text-green-700 mb-4 mt-6">
        Nature Nexus
      </h1>

      <h3 className="text-lg text-gray-600">This is the home page</h3>

      <a className="text-lg text-gray-600 underline" href="location">
        Location
      </a>
      <a className="text-lg text-gray-600 underline" href="image">
        Image recognition
      </a>
      <a className="text-lg text-gray-600 underline" href="login">
        Login Page
      </a>
      <a className="text-lg text-gray-600 underline" href="register">
        Sign up
      </a>
      <a className="text-lg text-gray-600 underline" href="message">
        Message
      </a>
      <a className="text-lg text-gray-600 underline" href="report">
        Report
      </a>
    </div>
  );
}

export default Home;
