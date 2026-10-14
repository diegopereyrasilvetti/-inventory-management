import React from "react";
import { createRoot } from "react-dom/client";
import Saludo from "./components/Saludo.jsx";

const contenedor = document.getElementById("react-root");

if (contenedor) {
  createRoot(contenedor).render(<Saludo />);
}
