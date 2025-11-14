import getConfig from "@/lib/config";
import { accessTokenAtom } from "@/stores/access-token";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useAtom } from "jotai/react";

function rtrim(str: string, ch: string) {
  let i = str.length;
  while (i-- && str.charAt(i) === ch);
  return str.substring(0, i + 1);
}

const config = getConfig();
export default function Doc() {
  console.log("fuck");
  const [token, setToken] = useAtom(accessTokenAtom);
  return (
    <div className="">
      <ApiReferenceReact
        configuration={{
          url: rtrim(config.backendUrl, "/") + "/doc",
          authentication: {
            preferredSecurityScheme: ["bearerAuth"],
            securitySchemes: {
              bearerAuth: {
                token: token,
              },
            },
          },
        }}
      />
    </div>
  );
}
