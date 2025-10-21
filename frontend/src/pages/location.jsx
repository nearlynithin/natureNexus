import { useState, useEffect } from "react";

function Location() {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude: latitude, longitude: longitude });
    });
  }, []);

  return (
    <>
      <h1>Current Position:</h1>
      <h3>Latitude: {coords.latitude}</h3>
      <h3>Longitude : {coords.longitude}</h3>
    </>
  );
}

export default Location;
