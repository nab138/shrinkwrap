import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { PrefsProvider } from "./utils/PrefsContext";
import { LogProvider } from "./utils/LogContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LogProvider>
      <PrefsProvider>
        <Hub />
      </PrefsProvider>
    </LogProvider>
  </React.StrictMode>
);
