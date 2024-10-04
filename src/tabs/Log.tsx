import React from "react";
import { useLog } from "../utils/LogContext";
import "./Log.css";

const LogViewer: React.FC = () => {
  const { log } = useLog();

  return (
    <div className="pageContainer">
      <pre className="logBox">
        {log.map((msg, i) => (
          <div key={i} className={msg.level}>
            {msg.message}
          </div>
        ))}
      </pre>
    </div>
  );
};

export default LogViewer;
