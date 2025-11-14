import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react-router";
import Home from "./Home";

function App() {
  return (
    <>
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
        <div className="absolute top-4 right-4 z-50  ">
          <UserButton />
        </div>
        <Home />
      </SignedIn>
    </>
  );
}

export default App;
