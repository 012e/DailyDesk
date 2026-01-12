import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "./components/login-button";
import Home from "./Home";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  const { isAuthenticated } = useAuth0();
  return (
    <div className="h-full w-full">
      {!isAuthenticated ? (
        <LoginButton />
      ) : (
        <div className="h-full w-full">
          <Home />
        </div>
      )}
    </div>
  );
}

export default App;
