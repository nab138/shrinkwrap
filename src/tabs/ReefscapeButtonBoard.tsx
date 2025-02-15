import { IDockviewPanelProps } from "dockview";
import useNTState from "../ntcore-react/useNTState";
import "./ReefscapeButtonBoard.css";

const ReefscapeButtonBoard: React.FC<
  IDockviewPanelProps<{ id: string }>
> = () => {
  const [_, setPressed] = useNTState<number[]>(
    "/SmartDashboard/ButtonBoardSim/Pressed",
    "double[]",
    []
  );
  return (
    <div className="pageContainer">
      <div className="buttonBoard">
        <button
          onClick={() => {
            setPressed([0, 1]);
          }}
        >
          Reef A
        </button>
        <button
          onClick={() => {
            setPressed([0, 2]);
          }}
        >
          Reef B
        </button>
        <button
          onClick={() => {
            setPressed([0, 3]);
          }}
        >
          Reef C
        </button>
        <br />
        <button
          onClick={() => {
            setPressed([2, 1]);
          }}
        >
          L1
        </button>
      </div>
    </div>
  );
};

export default ReefscapeButtonBoard;
