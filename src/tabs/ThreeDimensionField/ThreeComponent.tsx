import { Canvas, CanvasProps } from "@react-three/fiber";
import FieldModel from "./FieldModel.tsx";
import React, { useContext } from "react";
import { OrbitControls } from "@react-three/drei";
import RobotModel from "./RobotModel.tsx";
import NTContext from "../../../node_modules/ntcore-react/src/lib/NTContext.tsx";

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
  return (
    <ForwardCanvas
      gl={{ powerPreference: "default", antialias: false }}
      shadows={cinematic}
      className="three-canvas"
      camera={{ position: [0, 10, -15] }}
    >
      {field !== "" && <FieldModel cinematic={cinematic} field={field} />}
      {robots.map((r) => (
        <RobotModel key={field + r.key} ntKey={r.key} robot={r.robot} />
      ))}
      <OrbitControls
        maxPolarAngle={Math.PI / 2}
        maxDistance={30}
        enableDamping={true}
        dampingFactor={0.25}
      />
    </ForwardCanvas>
  );
};

export default ThreeComponent;

const ForwardCanvas: React.FC<CanvasProps> = ({ children }) => {
  const value = useContext(NTContext);
  return (
    <Canvas>
      <NTContext.Provider value={value}>{children}</NTContext.Provider>
    </Canvas>
  );
};
