import { IDockviewPanelProps } from "dockview";
import useNTState from "../ntcore-react/useNTState";
import "./ReefscapeButtonBoard.css";

const reefs: {
  num: number;
  name: string;
}[] = [];
for (let i = 0; i < 12; i++) {
  let letter = String.fromCharCode(65 + i).toUpperCase();
  reefs.push({
    num: i,
    name: `Reef ${letter}`,
  });
}

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
        <div className="buttonPanel">
          {reefs.map((reef) => (
            <button
              key={reef.num}
              onClick={() => setPressed([0, reef.num + 1])}
            >
              {reef.name}
            </button>
          ))}
        </div>
        <div className="buttonPanel">
          <button onClick={() => setPressed([2, 10])}>L1</button>
          <button onClick={() => setPressed([2, 9])}>L2</button>
          <button onClick={() => setPressed([2, 8])}>L3</button>
          <button onClick={() => setPressed([2, 7])}>L4</button>
        </div>
        <div className="buttonPanel">
          <button onClick={() => setPressed([1, 1])}>Intake L1</button>
          <button onClick={() => setPressed([1, 2])}>Intake L2</button>
          <button onClick={() => setPressed([1, 3])}>Intake L3</button>
          <button onClick={() => setPressed([1, 5])}>Intake R3</button>
          <button onClick={() => setPressed([1, 6])}>Intake R2</button>
          <button onClick={() => setPressed([1, 7])}>Intake R1</button>
        </div>
        <div className="buttonPanel">
          <button onClick={() => setPressed([1, 4])}>Algae Toggle</button>
          <button onClick={() => setPressed([0, 11])}>Net</button>
          <button onClick={() => setPressed([2, 12])}>Processor</button>
        </div>
      </div>
    </div>
  );
};

export default ReefscapeButtonBoard;
