import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Messenger from "./components/messenger";
import Location from "./pages/location";
import Register from "./components/register";
import SightingReport from "./components/report";
import Login from "./pages/login";
import Admin from "./pages/Admin";
import WaterMap from "./pages/watermap";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/message" element={<Messenger />} />
        <Route path="/location" element={<Location />} />
        <Route path="/image" element={<Admin />} />
        <Route path="/report" element={<SightingReport />} />
        <Route path="/watermap" element={<WaterMap />} />

      </Routes>
    </>
  );
}

export default App;
