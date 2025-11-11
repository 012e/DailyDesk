import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Layout from "./Layout.tsx";
import { ClerkProvider } from "@clerk/react-router";
import { BrowserRouter, Routes, Route } from "react-router";
import SignInPage from "./pages/sign-in.tsx";
import SignUpPage from "./pages/sign-up.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} signInUrl="/sign-in" 
      signUpUrl="/sign-up" afterSignOutUrl={"/sign-in"}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<App />}>
            </Route>
          </Route>

          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
