import FieldModel from "./FieldModel";
import React from "react";
import { OrbitControls, useContextBridge } from "@react-three/drei";
import RobotModel from "./RobotModel";
import { Canvas } from "@react-three/fiber";
import { platform } from "@tauri-apps/plugin-os";
import NTContext from "../../ntcore-react/NTContext";

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
  field,
  robots,
  cinematic,
}) => {
  const ContextBridge = useContextBridge(NTContext);
  return (
    <Canvas
      gl={{ powerPreference: "default", antialias: false }}
      shadows={cinematic}
      className="three-canvas"
      camera={{ position: [0, 10, -15] }}
    >
      {field !== "" && <FieldModel cinematic={cinematic} field={field} />}
      <ContextBridge>
        {robots.map((r) => (
          <RobotModel key={field + r.key} ntKey={r.key} robot={r.robot} />
        ))}
      </ContextBridge>
      {platform() != "linux" && (
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          maxDistance={30}
          enableDamping={true}
          dampingFactor={0.25}
        />
      )}
    </Canvas>
  );
};

export default ThreeComponent;
