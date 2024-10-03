import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { PrefsProvider } from "./utils/PrefsContext";
import { LogProvider } from "./utils/LogContext";
import NTProvider from "../node_modules/ntcore-react/src/lib/NTProvider";

const AppComponent = () => {
  const [ip, setIp] = React.useState("0.0.0.0");
  return (
    <NTProvider uri={ip}>
      <LogProvider>
        <PrefsProvider>
          <Hub setIp={setIp} />
        </PrefsProvider>
      </LogProvider>
    </NTProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);
