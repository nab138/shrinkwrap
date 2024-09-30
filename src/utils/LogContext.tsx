import React, { createContext, useContext, useState, useEffect } from "react";

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

    console.log = (...args: any[]) => {
      originalLog(...args);
      setLog((prevLog) => [
        ...prevLog,
        { level: "log", message: args.join(" ") },
      ]);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      setLog((prevLog) => [
        ...prevLog,
        { level: "error", message: args.join(" ") },
      ]);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      setLog((prevLog) => [
        ...prevLog,
        { level: "warn", message: args.join(" ") },
      ]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return <LogContext.Provider value={{ log }}>{children}</LogContext.Provider>;
};

export const useLog = (): LogContextType => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error("useLog must be used within a LogProvider");
  }
  return context;
};
