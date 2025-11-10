import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Messenger from "./components/messenger";
import Location from "./pages/location";
import Register from "./components/register";
import Login from "./pages/login";
import Admin from "./pages/Admin";

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
      </Routes>
    </>
  );
}

export default App;
