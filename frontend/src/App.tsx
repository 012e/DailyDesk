import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./components/logout";
import Profile from "./components/profile";
import LoginButton from "./components/login-button";
import api from "@/lib/api";
import { Button } from "./components/ui/button";

function App() {
  const { isAuthenticated } = useAuth0();
  async function doSomething() {
    await api.GET("/boards");
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
        </div>
      )}
    </div>
  );
}

export default App;
