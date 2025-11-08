import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./Home";
import Layout from "./Layout";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/react-router';

function App() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </SignedIn>
    </header>
  );
}

export default App;
