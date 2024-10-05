import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { LogProvider } from "./utils/LogContext";
import { StoreProvider } from "./utils/StoreContext";
import NTProvider from "./ntcore-react/NTProvider";

const MemoizedHub = React.memo(Hub);
export const MemoizedNTProvider = React.memo(NTProvider);
const MemoizedLogProvider = React.memo(LogProvider);

const AppComponent = () => {
  const [ip, setIp] = React.useState("127.0.0.1");

  const stableSetIp = React.useCallback((newIp: string) => {
    setIp(newIp);
  }, []);

  return (
    <MemoizedNTProvider uri={ip}>
      <StoreProvider>
        <MemoizedLogProvider>
          <MemoizedHub setIp={stableSetIp} />
        </MemoizedLogProvider>
      </StoreProvider>
    </MemoizedNTProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);
