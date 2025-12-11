import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "./components/login-button";
import Home from "./Home";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  const { isAuthenticated } = useAuth0();
  console.log("User is authenticated:", isAuthenticated);
  return (
    <div>
      {!isAuthenticated ? (
        <LoginButton />
      ) : (
        <div>
          <Home />
        </div>
      )}
    </div>
  );
}

export default App;
