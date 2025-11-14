import { Button } from "@/components/ui/button";
import getConfig from "@/lib/config";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useState } from "react";

function rtrim(str: string, ch: string) {
  let i = str.length;
  while (i-- && str.charAt(i) === ch);
  return str.substring(0, i + 1);
}

const config = getConfig();
export default function Doc() {
  const [token, setToken] = useState("shit");
  function updateToken() {
    setToken("fucking hell");
  }
  return (
    <div className="">
      <Button onClick={updateToken}>Update Token</Button>
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
