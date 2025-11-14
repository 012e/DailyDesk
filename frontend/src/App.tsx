import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./components/logout";
import Profile from "./components/profile";
import LoginButton from "./components/login-button";

function App() {
  const {isAuthenticated} = useAuth0();
  return (
    <div>
      {
        !isAuthenticated ? <LoginButton/> : 
        <div>
          <h1>Welcome to the App!</h1>
          <LogoutButton />
          <Profile />
        </div>
      }
    </div>
  );
}

export default App;
