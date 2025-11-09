import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./Home";
import Layout from "./Layout";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/react-router';

function App() {
  return (
    <header className="p-4 bg-background border-b border-border">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen">
          <SignInButton>
            <button className="px-6 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl">
              Sign In
            </button>
          </SignInButton>
        </div>
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
