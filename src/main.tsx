import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { PrefsProvider } from "./utils/PrefsContext";
import { LogProvider } from "./utils/LogContext";
import { NetworkTablesProvider } from "./networktables/NetworkTables";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NetworkTablesProvider>
      <LogProvider>
        <PrefsProvider>
          <Hub />
        </PrefsProvider>
      </LogProvider>
    </NetworkTablesProvider>
  </React.StrictMode>
);
