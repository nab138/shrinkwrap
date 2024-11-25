import { useState } from "react";
import { Class, ClassParam } from "./OxConfig";
import { paramToInputType } from "./Editor";
import { useToast } from "react-toast-plus";

export interface OxConfigTunerProps {
  classes: Class[];
  modes: string[];
  setClass: (data: string) => void;
  connected: boolean;
}

const OxConfigTuner: React.FC<OxConfigTunerProps> = ({
  classes,
  modes,
  setClass,
  connected,
}) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { addToast } = useToast();
  return (
    <div
      className="param-table-container tuner-container"
      style={{ border: "none" }}
    >
      {selectedClass === null && (
        <div>
          <h2>None Selected</h2>
        </div>
      )}

      {selectedClass !== null && (
        <table
          className="data-table param-table tuner-table tuner-data-table"
          style={{
            border: "1px solid var(--border-color)",
            borderCollapse: "collapse",
            padding: 0,
            height: "min-content",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr className="parameter-table-headers">
              <th colSpan={1 + modes.length}>
                <div style={{ width: "100%", textAlign: "center" }}>
                  <h2
                    style={{
                      margin: "5px",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    {selectedClass.prettyName}
                  </h2>
                </div>
              </th>
            </tr>
            <tr className="parameter-table-headers">
              <th>
                <div>Parameter</div>
              </th>
              {modes.map((mode) => (
                <th key={mode}>
                  <div>{mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className="parameter-table"
            style={{
              borderCollapse: "collapse",
              padding: 0,
              height: "min-content",
            }}
          >
            {selectedClass.parameters.map((param) => (
              <tr style={{ padding: 0 }} key={param.key}>
                <td style={{ padding: 0, paddingLeft: "10px" }}>
                  <div>{param.prettyName}</div>
                </td>
                {param.values.map((value, i) => (
                  <td
                    key={param.key + i}
                    style={{ padding: 0, paddingLeft: "10px" }}
                  >
                    <div>
                      {getInputElem(
                        param,
                        value,
                        connected,
                        modes[i],
                        setClass,
                        addToast.warning
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <table
        className="data-table param-table tuner-table"
        style={{
          border: "1px solid var(--border-color)",
          borderCollapse: "collapse",
          padding: 0,
          height: "min-content",
        }}
      >
        <thead>
          <tr className="parameter-table-headers">
            <th className="param-table-header">
              <div>
                <h2 style={{ margin: "5px" }}>Select a Controller</h2>
              </div>
            </th>
          </tr>
        </thead>
        <tbody
          className="parameter-table"
          style={{
            borderCollapse: "collapse",
            padding: 0,
            height: "min-content",
          }}
        >
          {classes.map((cls) => (
            <tr
              style={{ padding: 0 }}
              key={cls.key}
              onClick={() => {
                setSelectedClass(cls);
              }}
            >
              <td style={{ padding: 0, paddingLeft: "10px" }}>
                <div style={{ fontSize: "1.15em" }}>{cls.prettyName}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OxConfigTuner;

function getInputElem(
  param: ClassParam,
  value: any,
  connected: boolean,
  mode: string,
  setClass: (key: string) => void,
  warning: (msg: string) => void
) {
  let type = paramToInputType(param.type);
  let update = (e: any) => {
    let val;
    if (type === "checkbox") val = e.currentTarget.checked ? "true" : "false";
    else val = e.currentTarget.value;
    if (val === value) return;
    if (val === null || val === undefined || val === "") {
      warning("Invalid Value");
      return;
    }
    setClass(["single", param.key, mode, val ?? "0"].join(","));
  };
  let inputElem = (
    <input
      style={connected ? undefined : { color: "gray" }}
      disabled={!connected}
      key={value}
      type={type}
      onBlur={type === "checkbox" ? undefined : update}
      onChange={type === "checkbox" ? update : undefined}
      defaultValue={type === "checkbox" ? undefined : value}
      checked={type === "checkbox" ? value === "true" : undefined}
    />
  );
  return inputElem;
}
