import { useGLTF, Text } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
import { getQuaternionFromRotSeq } from "./RobotModel";
import CinematicLight from "./CinematicLight.tsx";
import { Field } from "./Fields.tsx";
export interface FieldProps {
  field: Field;
  cinematic: boolean;
}

const WPILIB_ROTATION = getQuaternionFromRotSeq([
  {
    axis: "x",
    degrees: -90,
  },
  {
    axis: "y",
    degrees: 180,
  },
]);

const cinematicLights = [
  [0, 1, 0, -2],
  [6, -3, 6, 2],
  [-6, -3, -6, 2],
];

const FieldModel: React.FC<FieldProps> = ({ field, cinematic }) => {
  const { scene } = useGLTF("3dfields/Field3d_" + field.year + ".glb");
  let MATERIAL_SPECULAR: THREE.Color = new THREE.Color(0x666666);
  let MATERIAL_SHININESS: number = 100;

  useEffect(() => {
    scene.traverse((node: any) => {
      let mesh = node as THREE.Mesh;
      if (mesh.isMesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        if (cinematic) {
          MATERIAL_SPECULAR = new THREE.Color(0x666666);
          MATERIAL_SHININESS = 100;
          let newMaterial = new THREE.MeshPhongMaterial({
            color: mesh.material.color,
            transparent: mesh.material.transparent,
            opacity: mesh.material.opacity,
            specular: MATERIAL_SPECULAR,
            shininess: MATERIAL_SHININESS,
          });
          if (mesh.name.toLowerCase().includes("carpet")) {
            newMaterial.shininess = 0;
            mesh.castShadow = false;
            mesh.receiveShadow = true;
          } else {
            mesh.castShadow = !mesh.material.transparent;
            mesh.receiveShadow = !mesh.material.transparent;
          }
          mesh.material.dispose();
          mesh.material = newMaterial;
        } else {
          MATERIAL_SPECULAR = new THREE.Color(0x000000);
          MATERIAL_SHININESS = 0;
          mesh.material.metalness = 0;
          mesh.material.roughness = 1;
        }
      }
    });
  }, [scene, cinematic]);

  if (scene == null) return <Text>Loading...</Text>;
  return (
    <mesh>
      <hemisphereLight
        color={0xffffff}
        groundColor={0x444444}
        intensity={cinematic ? 0.5 : 2}
      />
      <group rotation={new THREE.Euler().setFromQuaternion(WPILIB_ROTATION)}>
        {!cinematic && <pointLight intensity={0.5} position={[0, 0, 10]} />}
        {cinematic &&
          cinematicLights.map((light, index) => (
            <CinematicLight
              key={index}
              position={[light[0], light[1], 8]}
              targetPosition={[light[2], light[3], 0]}
            />
          ))}
        {cinematic && (
          <pointLight color={0xff0000} intensity={60} position={[4.5, 0, 5]} />
        )}
        {cinematic && (
          <pointLight color={0x0000ff} intensity={60} position={[-4.5, 0, 5]} />
        )}
      </group>
      {scene != undefined && (
        <group rotation={getEulerFromY(field.fieldRot)}>
          <primitive object={scene} />
        </group>
      )}
    </mesh>
  );
};

function getEulerFromY(y: number): THREE.Euler {
  return new THREE.Euler(0, (y * Math.PI) / 180, 0);
}

export default FieldModel;
