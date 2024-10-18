import React, { useState, useEffect, useRef } from "react";
import fuzzysort from "fuzzysort";
import useNTState from "../ntcore-react/useNTState";
import { NetworkTablesTypeInfos } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src";
import useNTValue from "../ntcore-react/useNTValue";
import useNTConnected from "../ntcore-react/useNTConnected";
import { useStore } from "../utils/StoreContext";
import "./OxConfigEditor.css";

const OxConfigEditor: React.FC = () => {
  const [deployDir] = useStore("deployDir", "");

  const modesRaw = useNTValue<string>(
    "/OxConfig/Modes",
    NetworkTablesTypeInfos.kString,
    ""
  );
  const [modes, setModes] = useState<string[]>([]);
  useEffect(() => {
    if (!modesRaw) return;
    let split = modesRaw.split(",");
    if (split.length > 0) setModes(modesRaw.split(","));
  }, [modesRaw]);

  return (
    <div className="pageContainer config-editor">
      <div>
        <div>
          <div
            className="config-editor-line"
            style={{ padding: "20px", paddingBottom: "10px" }}
          >
            <h2>Config Editor</h2>
            <p className="deploy-dir deploy-path-cfg">
              Deploy Directory
              <span className="question-icon">?</span>
              <span className="extra-info">
                The config file is modified directly on the rio, which will be
                overwritten on code rebuild. To save locally to prevent this and
                for source control, you must select a deploy directory in
                Settings.
              </span>
              <span style={{ marginRight: "5px" }}>:</span>
              <code className="deploy-dir-path">
                {deployDir === "" ? "Not Set" : deployDir}
              </code>
            </p>
          </div>
          <div className="warning-container">
            <div className="ce-warning">
              <h3 className="warning-text">
                <span className="warning-prefix">⚠️ Warning! </span>The robot is
                disconnected. All changes from now until reconnection will be
                lost.
              </h3>
            </div>
            <div className="ce-warning">
              <h3 className="warning-text">
                <span className="warning-prefix">⚠️ Warning! </span>The deploy
                directory is unset. Changes will be overwritten on code rebuild.
              </h3>
            </div>
            <div className="ce-warning">
              <h3 className="warning-text">
                <span className="warning-prefix">⚠️ Warning! </span>
                <span className="warning-content">
                  Failed to write file: Deploy directory is missing or doesn't
                  contain config.json.
                </span>
              </h3>
            </div>
            <div className="ce-warning success">
              <h3 className="warning-text">
                <span className="success-prefix">✅ Success! </span>
                <span className="warning-content">
                  {" "}
                  Wrote config to deploy folder.
                </span>
              </h3>
            </div>
          </div>
          <div className="config-editor-line">
            <div className="search">
              <h3>Search</h3>
              <input
                className="config-search"
                type="text"
                placeholder="Search..."
              />
            </div>
            <div className="mode-dropdown-container">
              <h3 className="mode-text">Mode</h3>
              <select className="dropdown mode-dropdown">
                {modes.length == 0 && (
                  <option value="failed">Not connected</option>
                )}
                {modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="param-table-container">
          <table className="data-table param-table">
            <thead>
              <tr className="parameter-table-headers">
                <th className="param-table-header">Parameter</th>
                <th className="comment-table-header">Comment</th>
                {modes.map((mode) => (
                  <th key={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    <div className="resizer" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="parameter-table"></tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OxConfigEditor;
