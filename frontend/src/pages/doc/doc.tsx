import getConfig from "@/lib/config";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

function rtrim(str: string, ch: string) {
  let i = str.length;
  while (i-- && str.charAt(i) === ch);
  return str.substring(0, i + 1);
}

const config = getConfig();
export default function Doc() {
  return (
    <SwaggerUI url={rtrim(config.backendUrl, "/") + "/doc"} withCredentials />
  );
}
