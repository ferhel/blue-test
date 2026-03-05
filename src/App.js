import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./components/Inicio";
import BlueTest from "./components/BlueTest";
import SalaEstudio from "./components/SalaEstudio";
import Historial from "./components/Historial";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Inicio />} />
        <Route path="/test"      element={<BlueTest />} />
        <Route path="/sala"      element={<SalaEstudio />} />
        <Route path="/historial" element={<Historial />} />
      </Routes>
    </BrowserRouter>
  );
}
