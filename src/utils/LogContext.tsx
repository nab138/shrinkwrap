import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useStore } from "./StoreContext";

type LogMessage = {
  level: "log" | "error" | "warn";
  message: string;
};

type LogContextType = {
  log: LogMessage[];
};

const LogContext = createContext<LogContextType | undefined>(undefined);

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [displayConnection] = useStore("displayConnection", false);
  const [log, setLog] = useState<LogMessage[]>([]);

  useEffect(() => {
    const logMessage = (level: LogMessage["level"], ...args: any[]) => {
      setLog((prevLog) => [...prevLog, { level, message: args.join(" ") }]);
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      logMessage("log", ...args);
    };

    console.error = (...args: any[]) => {
      // If args is a websocket error (but not other errors), ignore it (args[0] is "WebSocket error:")
      if (!displayConnection && args[0].startsWith("WebSocket error:")) return;
      originalError(...args);
      logMessage("error", ...args);
    };

    console.warn = (...args: any[]) => {
      if (
        !displayConnection &&
        (args[0].startsWith("Unable to connect to Robot") ||
          args[0].startsWith("Reconnect will be attempted in"))
      )
        return;
      originalWarn(...args);
      logMessage("warn", ...args);
    };

    console.info = (...args: any[]) => {
      if (!displayConnection && args[0].startsWith("Connected on NT 4.0"))
        return;
      originalInfo(...args);
      logMessage("log", ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [displayConnection]);

  const contextValue = useMemo(() => ({ log }), [log]);

  return (
    <LogContext.Provider value={contextValue}>{children}</LogContext.Provider>
  );
};

export const useLog = (): LogContextType => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error("useLog must be used within a LogProvider");
  }
  return context;
};
