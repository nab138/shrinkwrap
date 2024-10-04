import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { LogProvider } from "./utils/LogContext";
import NTProvider from "../node_modules/ntcore-react/src/lib/NTProvider";
import { StoreProvider } from "./utils/StoreContext";

const AppComponent = () => {
  const [ip, setIp] = React.useState("127.0.0.1");
  return (
    <StoreProvider>
      <NTProvider uri={ip}>
        <LogProvider>
          <Hub setIp={setIp} />
        </LogProvider>
      </NTProvider>
    </StoreProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);
