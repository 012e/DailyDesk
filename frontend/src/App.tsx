import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./components/logout";
import Profile from "./components/profile";
import LoginButton from "./components/login-button";
import { Button } from "./components/ui/button";
import httpClient from "./lib/client";
import Home from "./Home.tsx";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  const { isAuthenticated } = useAuth0();
  async function doSomething() {
    await httpClient.get("/boards");
  }
  return (
    <div>
      {!isAuthenticated ? (
        <LoginButton />
      ) : (
        <div>
          <h1>Welcome to the App!</h1>
          <Button onClick={doSomething}>Hello</Button>
          <LogoutButton />
          <Profile />
          <Home />
          {children}
        </div>
      )}
    </div>
  );
}

export default App;
