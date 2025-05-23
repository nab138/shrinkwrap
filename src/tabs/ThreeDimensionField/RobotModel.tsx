import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { useNTValue } from "../../ntcore-react/useNTValue";
import { Field } from "./Fields";

export interface RobotConfig {
  position: [number, number, number];
  rotations: RobotConfigRotation[];
}

export interface RobotConfigRotation {
  axis: "x" | "y" | "z";
  degrees: number;
}

export const robotProps = {
  KitBot: {
    rotations: [{ axis: "y", degrees: 90 }],
    position: [0, 0, -0.005],
  } as RobotConfig,
  "Duck Bot": {
    rotations: [
      { axis: "x", degrees: -90 },
      { axis: "y", degrees: -90 },
    ],
    position: [0, 0, 0],
  } as RobotConfig,
  "Crab Bot": {
    rotations: [{ axis: "x", degrees: -90 }],
    position: [0, 0, 0.045],
  } as RobotConfig,
};

export interface RobotModelProps {
  robot: string;
  ntKey: string;
  cinematic?: boolean;
  field: Field;
}
const RobotModel: React.FC<RobotModelProps> = ({
  robot: robotName,
  cinematic,
  ntKey,
  field,
}) => {
  let position = useNTValue<number[]>(ntKey, [-99, -99, -99], 0.001);
  let MATERIAL_SPECULAR: THREE.Color = new THREE.Color(0x666666);
  let MATERIAL_SHININESS: number = 100;
  const robotInner = useGLTF("Robot_" + robotName + ".glb").scene;
  const [robot, setRobot] = useState<THREE.Group | undefined>(undefined);

  useEffect(() => {
    let robotConfig = robotProps[robotName as keyof typeof robotProps];
    robotInner.rotation.setFromQuaternion(
      getQuaternionFromRotSeq(robotConfig.rotations)
    );
    robotInner.position.set(...robotConfig.position);
    let robotTemp = new THREE.Group();
    robotTemp.add(robotInner);
    // Make temporarily invisible
    //robot.visible = false;
    robotTemp.traverse((node: any) => {
      let mesh = node as THREE.Mesh; // Traverse function returns Object3d or Mesh
      if (mesh.isMesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        if (cinematic) {
          MATERIAL_SPECULAR = new THREE.Color(0x666666);
          MATERIAL_SHININESS = 100;
          // Cinematic, replace with MeshPhongMaterial
          let newMaterial = new THREE.MeshPhongMaterial({
            color: mesh.material.color,
            transparent: mesh.material.transparent,
            opacity: mesh.material.opacity,
            specular: MATERIAL_SPECULAR,
            shininess: MATERIAL_SHININESS,
          });
          mesh.material.dispose();
          mesh.material = newMaterial;
          mesh.castShadow = !mesh.material.transparent;
          mesh.receiveShadow = !mesh.material.transparent;
        } else {
          MATERIAL_SPECULAR = new THREE.Color(0x000000);
          MATERIAL_SHININESS = 0;
          mesh.material.metalness = 0;
          mesh.material.roughness = 1;
        }
      }
    });
    setRobot(robotTemp);
  }, [robotInner]);

  useEffect(() => {
    if (robot !== undefined) {
      if (
        robot &&
        position[0] === -1 &&
        position[1] === -1 &&
        position[2] === -1
      ) {
        robot.visible = false;
        return;
      }
      let x = -(position[0] - field.fieldX / 2);
      let y = position[1] - field.fieldY / 2;
      let rotation = position[2];
      robot.visible = true;
      robot.position.set(x, 0, y);
      robot.rotation.y = (rotation * Math.PI) / 180;
    }
  }, [position, robot, field]);
  return (
    <>
      {robot !== undefined &&
        position !== undefined &&
        JSON.stringify(position) !== JSON.stringify([-99, -99, -99]) && (
          <primitive object={robot} />
        )}
    </>
  );
};

export default RobotModel;

export function getQuaternionFromRotSeq(
  rotations: RobotConfigRotation[]
): THREE.Quaternion {
  let quaternion = new THREE.Quaternion();
  rotations.forEach((rotation) => {
    let axis = new THREE.Vector3(0, 0, 0);
    if (rotation.axis === "x") axis.setX(1);
    if (rotation.axis === "y") axis.setY(1);
    if (rotation.axis === "z") axis.setZ(1);
    quaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(
        axis,
        (rotation.degrees * Math.PI) / 180
      )
    );
  });
  return quaternion;
}
