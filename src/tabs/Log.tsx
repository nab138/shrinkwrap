import React from "react";
import { useLog } from "../utils/LogContext";
import "./Log.css";

const LogViewer: React.FC = () => {
  const { log } = useLog();

  return (
    <div className="pageContainer">
      <h2>Console Log</h2>
      <pre
        style={{
          width: "calc(100% - 20px)",
          backgroundColor: "#0005",
          height: "100%",
          margin: "5px",
          borderRadius: "5px",
          textAlign: "left",
          padding: "5px",
        }}
      >
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