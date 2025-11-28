import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import { useAuth0 } from "@auth0/auth0-react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import PleaseLogin from "./please-login";

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
    null
  );

  useEffect(() => {
    if (auth.isAuthenticated) {
      setGetAcessTokenFn(() => auth.getAccessTokenSilently);
      getAccessTokenFnRef.current = auth.getAccessTokenSilently;
    }
  }, [auth, setGetAcessTokenFn]);

  useEffect(() => {
    if (isUpdating.current || !auth.isAuthenticated) {
      return;
    }

    async function updateAccessToken() {
      const getAccessToken = getAccessTokenFnRef.current;

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
  }, [auth, accessToken, setAccessToken]);

  if (!auth.isAuthenticated) {
    return <PleaseLogin onClick={() => auth.loginWithRedirect()}></PleaseLogin>;
  }

  return children;
}
