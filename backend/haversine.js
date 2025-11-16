import db from "./db/conn.js";

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dlon / 2) * Math.sin(dlon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

export async function getNearbyUserIdsFromCoords(lat, long, radiusKm = 6) {
  const users = await db.collection("users").find({}).toArray();

  return users
    .filter((u) => {
      console.log(u);
      if (u.latitude == null || u.longitude == null) return false;
      const dist = haversine(lat, long, u.latitude, u.longitude);
      return dist / 1000 < radiusKm;
    })
    .map((u) => u._id.toString());
}
