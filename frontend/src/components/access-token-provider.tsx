import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import { useAuth0 } from "@auth0/auth0-react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

export default function AccessTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth0();
  const isUpdating = useRef(false);

  const [, setGetAcessTokenFn] = useAtom(getAccessTokenFnAtom);
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);

  const getAccessTokenFnRef = useRef<typeof auth.getAccessTokenSilently | null>(
    null,
  );

  useEffect(() => {
    if (!auth.isAuthenticated) {
      auth.loginWithRedirect();
    } else if (auth.isAuthenticated && auth.getAccessTokenSilently) {
      setGetAcessTokenFn(auth.getAccessTokenSilently);
      getAccessTokenFnRef.current = auth.getAccessTokenSilently;
    }
  }, [auth, setGetAcessTokenFn]);

  useEffect(() => {
    if (isUpdating.current) {
      return;
    }

    async function updateAccessToken() {
      const getAccessToken = getAccessTokenFnRef.current;
      console.log(getAccessToken);
      console.log("access token", accessToken);
      console.log("cond", !accessToken && getAccessToken);

      if (!accessToken && getAccessToken) {
        isUpdating.current = true;
        try {
          const newToken = await getAccessToken();

          setAccessToken(newToken);
        } catch (error) {
          console.error("Failed to get new access token:", error);
        } finally {
          isUpdating.current = false;
        }
      }
    }
    updateAccessToken();
  }, [accessToken, setAccessToken]);

  return children;
}
