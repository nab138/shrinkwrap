import { Rect } from "react-konva";

export interface RobotProps {
  position: [number, number];
  scale: number;
}

const Robot: React.FC<RobotProps> = ({ position, scale }) => {
  return (
    <Rect
      x={position[0]}
      y={position[1]}
      width={scale * 200}
      height={scale * 200}
      cornerRadius={scale * 15}
      fill="white"
    />
  );
};

export default Robot;
