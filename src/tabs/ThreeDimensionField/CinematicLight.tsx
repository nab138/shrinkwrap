import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface CinematicLightProps {
  position: [number, number, number];
  targetPosition: [number, number, number];
}
const CinematicLight: React.FC<CinematicLightProps> = ({
  position,
  targetPosition,
  ...props
}) => {
  const light = useRef<THREE.SpotLight | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (light.current) {
      light.current.shadow.mapSize.width = 2048;
      light.current.shadow.mapSize.height = 2048;
      light.current.shadow.bias = -0.0001;

      const targetObject = new THREE.Object3D();
      targetObject.position.set(...targetPosition);
      scene.add(targetObject);
      light.current.target = targetObject;
    }
  }, [light, scene, targetPosition]);

  return (
    <spotLight
      ref={light}
      position={position}
      intensity={150}
      angle={50 * (Math.PI / 180)}
      penumbra={0.2}
      castShadow={true}
      {...props}
    />
  );
};

export default CinematicLight;
