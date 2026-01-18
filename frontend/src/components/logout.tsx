import { useAuth0 } from "@auth0/auth0-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { accessTokenAtom } from "@/stores/access-token";

const LogoutButton = () => {
  const { logout } = useAuth0();
  const queryClient = useQueryClient();
  const setAccessToken = useSetAtom(accessTokenAtom);

  const handleLogout = () => {
    // Clear React Query cache to prevent stale data
    queryClient.clear();
    // Clear access token
    setAccessToken("");
    // Clear localStorage access token
    localStorage.removeItem("accessToken");
    // Logout via Auth0
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <button onClick={handleLogout}>
      Log Out
    </button>
  );
};

export default LogoutButton;