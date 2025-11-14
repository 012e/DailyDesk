import { Auth0Provider } from "@auth0/auth0-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import { authConfig } from "./auth.config.ts";
import "./index.css";
import Layout from "./Layout.tsx";
import Kanban from "./pages/kanban.tsx";
import SignInPage from "./pages/sign-in.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={authConfig.domain}
        clientId={authConfig.clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<App />} />
            <Route path="/kanban" element={<Kanban />} />
          </Route>

          <Route path="/sign-in" element={<SignInPage />} />
        </Routes>
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
);
