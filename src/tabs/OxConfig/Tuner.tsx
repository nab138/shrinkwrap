import { useState } from "react";
import { Class } from "./OxConfig";

export interface OxConfigTunerProps {
  classes: Class[];
  modes: string[];
}

const OxConfigTuner: React.FC<OxConfigTunerProps> = ({ classes, modes }) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
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
          }}
        >
          <thead>
            <tr className="parameter-table-headers">
              <th colSpan={1 + modes.length} className="param-table-header">
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
              <th className="param-table-header">
                <div>Parameter</div>
              </th>
              {modes.map((mode) => (
                <th className="param-table-header">
                  <div>{mode}</div>
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
                {param.values.map((value) => (
                  <td style={{ padding: 0, paddingLeft: "10px" }}>
                    <div>{value}</div>
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
