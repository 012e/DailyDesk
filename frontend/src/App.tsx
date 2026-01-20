import { useAuth0 } from "@auth0/auth0-react";
import Home from "./Home";
import LandingPage from "./components/landing-page";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  const { isAuthenticated } = useAuth0();
  return (
    <>
      {!isAuthenticated ? (
        <LandingPage />
      ) : (
        <div className="h-full w-full">
          <Home />
        </div>
      )}
    </>
  );
}

export default App;
