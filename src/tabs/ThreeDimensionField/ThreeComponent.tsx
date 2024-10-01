import { Canvas } from "@react-three/fiber";
import FieldModel from "./FieldModel.tsx";
import React from "react";
import { OrbitControls } from "@react-three/drei";
import RobotModel from "./RobotModel.tsx";

export interface ThreeComponentProps {
  field: string;
  robot: string;
  position: [number, number, number];
  cinematic: boolean;
}
const ThreeComponent: React.FC<ThreeComponentProps> = ({
  field,
  robot,
  position,
  cinematic,
}) => {
  return (
    <>
      <Canvas
        gl={{ powerPreference: "default", antialias: false }}
        shadows={cinematic}
        className="three-canvas"
        camera={{ position: [0, 10, -15] }}
      >
        {field !== "" && <FieldModel cinematic={cinematic} field={field} />}
        {robot !== "" && (
          <RobotModel key={field + robot} position={position} robot={robot} />
        )}
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          maxDistance={30}
          enableDamping={true}
          dampingFactor={0.25}
        />
      </Canvas>
    </>
  );
};

export default ThreeComponent;
