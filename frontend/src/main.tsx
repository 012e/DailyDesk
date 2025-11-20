import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import "./index.css";
import Layout from "./Layout.tsx";
import Kanban from "./pages/kanban.tsx";

import SignInPage from "./pages/sign-in.tsx";

const Doc = lazy(() => import("@/pages/doc/doc.tsx"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/doc" element={<Doc />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
