import { Class } from "./OxConfig";

export interface OxConfigTunerProps {
  classes: Class[];
}

const OxConfigTuner: React.FC<OxConfigTunerProps> = ({ classes }) => {
  return (
    <div>
      <ul>
        {classes.map((c) => (
          <li>{c.prettyName}</li>
        ))}
      </ul>
    </div>
  );
};

export default OxConfigTuner;
