import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import "./index.css";
import Layout from "./Layout.tsx";
import { Kanban } from "./pages/kanban";
import Tasks from "./pages/tasks.tsx";
import ProfilePage from "./pages/profile.tsx";

import NotFound from "@/pages/not-found.tsx";
import SignInPage from "./pages/sign-in.tsx";

const Doc = lazy(() => import("@/pages/doc/doc.tsx"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />} errorElement={<h1>error</h1>}>
          <Route path="/" element={<App />} />
          <Route path="/board/:boardId" element={<Kanban />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/doc" element={<Doc />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
