import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Messenger from "./components/messenger";
import Location from "./pages/location";
import Register from "./components/register";
import Login from "./pages/login";
import ImageViewer from "./components/image";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/message" element={<Messenger />} />
        <Route path="/location" element={<Location />} />
        <Route
          path="/image"
          element={<ImageViewer x1={115} y1={130} x2={180} y2={198} />}
        />
      </Routes>
    </>
  );
}

export default App;
