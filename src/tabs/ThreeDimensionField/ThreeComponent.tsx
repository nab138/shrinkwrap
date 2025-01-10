import FieldModel from "./FieldModel";
import React, { useEffect, useState } from "react";
import { useContextBridge } from "@react-three/drei";
import RobotModel from "./RobotModel";
import { Canvas } from "@react-three/fiber";
import NTContext from "../../ntcore-react/NTContext";
import OrbitControls from "./OrbitControls.tsx";
import { Field, fields } from "./Fields.tsx";

export interface RobotData {
  key: string;
  robot: string;
}

export interface ThreeComponentProps {
  field: string;
  robots: RobotData[];
  cinematic: boolean;
}

const ThreeComponent: React.FC<ThreeComponentProps> = ({
  field: fieldName,
  robots,
  cinematic,
}) => {
  const [field, setField] = useState<Field | undefined>(
    fields.find((f) => f.year == fieldName)
  );
  useEffect(() => {
    setField(fields.find((f) => f.year == fieldName));
  }, [fieldName]);

  const ContextBridge = useContextBridge(NTContext);
  return (
    <Canvas
      gl={{ powerPreference: "default", antialias: false }}
      shadows={cinematic}
      className="three-canvas"
      camera={{ position: [0, 10, -15] }}
    >
      {field !== undefined && (
        <FieldModel cinematic={cinematic} field={field} />
      )}
      <ContextBridge>
        {field != undefined &&
          robots.map((r) => (
            <RobotModel
              key={fieldName + r.key}
              ntKey={r.key}
              robot={r.robot}
              field={field}
            />
          ))}
      </ContextBridge>
      <OrbitControls
        maxPolarAngle={Math.PI / 2}
        enableDamping={true}
        dampingFactor={0.25}
        keyEvents={true}
      />
    </Canvas>
  );
};
export default ThreeComponent;
