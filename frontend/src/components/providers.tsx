import { ThemeProvider } from "./theme-provider";
import { authConfig } from "@/auth.config.ts";
import { Auth0Provider } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import AccessTokenProvider from "./access-token-provider";
import store from "@/stores/store";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider store={store}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Auth0Provider
          domain={authConfig.domain}
          clientId={authConfig.clientId}
          authorizationParams={{
            redirect_uri: window.location.origin,
            audience: authConfig.audience,
            scope: "openid profile email",
          }}
          cacheLocation="localstorage"
          useRefreshTokens
        >
          <QueryClientProvider client={queryClient}>
            <AccessTokenProvider>{children}</AccessTokenProvider>
          </QueryClientProvider>
        </Auth0Provider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
