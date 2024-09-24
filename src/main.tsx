import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { PrefsProvider } from "./utils/PrefsContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PrefsProvider>
      <Hub />
    </PrefsProvider>
  </React.StrictMode>
);
