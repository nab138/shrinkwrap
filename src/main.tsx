import React from "react";
import ReactDOM from "react-dom/client";
import Hub from "./hub/Hub";
import { LogProvider } from "./utils/LogContext";
import { StoreProvider } from "./utils/StoreContext";
import NTProvider from "./ntcore-react/NTProvider";
import { ToastProvider } from "react-toast-plus";
import { platform } from "@tauri-apps/plugin-os";

const MemoizedHub = React.memo(Hub);
const MemoizedNTProvider = React.memo(NTProvider);
const MemoizedLogProvider = React.memo(LogProvider);

const AppComponent = () => {
  const [ip, setIp] = React.useState("127.0.0.1");

  const stableSetIp = React.useCallback((newIp: string) => {
    setIp(newIp);
  }, []);

  return (
    <MemoizedNTProvider uri={ip === "" ? "0" : ip}>
      <StoreProvider>
        <MemoizedLogProvider>
          <ToastProvider
            toastOptions={{
              closeOnClick: true,
              placement: "bottom-right",
              pauseOnFocusLoss:
                platform() !== "ios" && platform() !== "android",
            }}
          >
            <MemoizedHub setIp={stableSetIp} ip={ip === "" ? "0" : ip} />
          </ToastProvider>
        </MemoizedLogProvider>
      </StoreProvider>
    </MemoizedNTProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AppComponent />
);
