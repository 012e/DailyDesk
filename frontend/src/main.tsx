import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ClerkProvider } from "@clerk/react-router";
import { BrowserRouter, Route, Routes } from "react-router";
// import SignInPage from "./pages/sign-in.tsx";
import Kanban from "./pages/kanban.tsx";
import Layout from "./Layout.tsx";
import Home from "./Home.tsx";
import SignInPage from "./pages/sign-in.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} signInUrl="/sign-in">
        <Routes>
          <Route path="/" element={<Layout />} >
            <Route index element={<Home />} />
            <Route path="/kanban" element={<Kanban />} />
          </Route>
          <Route path="/sign-in" element={<SignInPage />} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
