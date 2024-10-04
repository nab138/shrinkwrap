import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

type LogMessage = {
  level: "log" | "error" | "warn";
  message: string;
};

type LogContextType = {
  log: LogMessage[];
};

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [log, setLog] = useState<LogMessage[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const logMessage = (level: LogMessage["level"], ...args: any[]) => {
      setLog((prevLog) => [...prevLog, { level, message: args.join(" ") }]);
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      logMessage("log", ...args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      logMessage("error", ...args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      logMessage("warn", ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

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
