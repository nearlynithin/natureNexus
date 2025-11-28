import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function AlertAnalytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("http://localhost:3000/analytics/sightings");
      const json = await res.json();
      if (json.success) setData(json.data);
    }
    load();
  }, []);

  const sightingsByDay = Object.values(
    data.reduce((acc, s) => {
      const d = new Date(s.timestamp).toISOString().split("T")[0];
      acc[d] = acc[d] || { day: d, count: 0 };
      acc[d].count++;
      return acc;
    }, {}),
  );

  const sightingsByAnimal = Object.values(
    data.reduce((acc, s) => {
      const key = s.animal || "Unknown";
      acc[key] = acc[key] || { animal: key, count: 0 };
      acc[key].count++;
      return acc;
    }, {}),
  );

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-3xl font-semibold text-green-900">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-xl font-semibold mb-4">Sightings per Day</h3>
          <LineChart width={400} height={250} data={sightingsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2}
            />
          </LineChart>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-xl font-semibold mb-4">Animals Reported</h3>
          <BarChart width={400} height={250} data={sightingsByAnimal}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="animal" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#16a34a" />
          </BarChart>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-xl font-semibold mb-4">Animal Distribution</h3>
          <PieChart width={400} height={260}>
            <Pie
              data={sightingsByAnimal}
              dataKey="count"
              nameKey="animal"
              outerRadius={100}
            >
              {sightingsByAnimal.map((_, i) => (
                <Cell key={i} fill={`hsl(${i * 45}, 70%, 50%)`} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>
    </div>
  );
}
