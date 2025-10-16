import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Messenger from "./components/messenger";
import "./App.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/message" element={<Messenger />} />
      </Routes>
    </>
  );
}

export default App;
