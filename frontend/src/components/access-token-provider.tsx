import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import { useAuth0 } from "@auth0/auth0-react";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import LandingPage from "./landing-page";

export default function AccessTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth0();
  const isUpdating = useRef(false);
  const [isTokenReady, setIsTokenReady] = useState(false);

  const [, setGetAcessTokenFn] = useAtom(getAccessTokenFnAtom);
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);

  const getAccessTokenFnRef = useRef<(() => Promise<string>) | null>(null);

  useEffect(() => {
    if (auth.isAuthenticated) {
      const boundGetAccessToken = () => auth.getAccessTokenSilently();
      setGetAcessTokenFn(() => boundGetAccessToken);
      getAccessTokenFnRef.current = boundGetAccessToken;
    } else {
      getAccessTokenFnRef.current = null;
      setIsTokenReady(false);
    }
  }, [auth.isAuthenticated, setGetAcessTokenFn]);

  useEffect(() => {
    if (isUpdating.current || !auth.isAuthenticated) {
      return;
    }

    async function updateAccessToken() {
      isUpdating.current = true;
      try {
        const newToken = await auth.getAccessTokenSilently({ ignoreCache: true });
        setAccessToken(newToken);
        setIsTokenReady(true);
      } catch (error) {
        console.error("Failed to refresh access token:", error);
        setAccessToken("");
        setIsTokenReady(false);
      } finally {
        isUpdating.current = false;
      }
    }
    updateAccessToken();
  }, [auth, setAccessToken]);

  // Show loading while Auth0 is initializing
  if (auth.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!auth.isAuthenticated) {
    return <LandingPage />;
  }

  // Wait for access token to be fetched before rendering children
  // Wait for access token to be fetched before rendering children
  if (!isTokenReady && !accessToken) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return children;
}
