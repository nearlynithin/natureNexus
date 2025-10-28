import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Messenger from "./components/messenger";
import Location from "./pages/location";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/message" element={<Messenger />} />
        <Route path="/location" element={<Location />} />
      </Routes>
    </>
  );
}

export default App;
