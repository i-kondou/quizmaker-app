import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ImageManagementPage from "./App";
import HeritageListPage from "./pages/HeritageListPage";
import Navigation from "./components/Navigateion";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<ImageManagementPage />} />
        <Route path="/heritages" element={<HeritageListPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
