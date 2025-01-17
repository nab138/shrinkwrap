import { Line } from "react-konva";
import { useComputedNTValue } from "../../ntcore-react/useNTValue";

export interface TrajectoryProps {
  ntKey: string;
  calcCoordinates: (
    translation: [number, number],
    alwaysFlipped: boolean
  ) => [number, number];
  size: number;
  color: string;
}

const Trajectory: React.FC<TrajectoryProps> = ({
  ntKey,
  calcCoordinates,
  size,
  color,
}) => {
  const trajectory = useComputedNTValue<number[], number[]>(
    ntKey,
    (raw) => {
      let coords: number[] = [];
      if (raw.length % 3 !== 0) {
        console.warn("Invalid trajectory data");
      }
      for (let i = 0; i < raw.length; i += 3) {
        if (i + 1 >= raw.length) {
          break;
        }
        coords.push(...calcCoordinates([raw[i], raw[i + 1]], false));
      }
      return coords;
    },
    [-99, -99],
    0.01
  );
  return (
    <Line
      points={trajectory}
      stroke={color}
      strokeWidth={size}
      lineCap="round"
    />
  );
};

export default Trajectory;
