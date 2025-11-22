import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "./components/login-button";
import Home from "./Home";

function App() {
  const { isAuthenticated } = useAuth0();
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
