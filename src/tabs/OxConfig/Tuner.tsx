import { Class } from "./OxConfig";

export interface OxConfigTunerProps {
  classes: Class[];
}

const OxConfigTuner: React.FC<OxConfigTunerProps> = ({ classes }) => {
  return (
    <div className="param-table-container tuner-container">
      <div>
        <h2>None Selected</h2>
      </div>

      <table
        className="data-table param-table tuner-table"
        style={{ borderLeft: "1px solid var(--border-color)" }}
      >
        <thead>
          <tr className="parameter-table-headers">
            <th className="param-table-header">
              <div>Select a Controller</div>
            </th>
          </tr>
        </thead>
        <tbody className="parameter-table">
          {classes.map((cls) => (
            <tr key={cls.key}>
              <td style={{ padding: 0 }}>
                <div>{cls.prettyName}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OxConfigTuner;
