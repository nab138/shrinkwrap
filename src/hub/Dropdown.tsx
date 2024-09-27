import { useState } from "react";
import "./Dropdown.css";

export interface DropdownProps {
  options: { id: string; title: string }[];
  onSelect: (selected: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  onSelect,
  className,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div className={"dropdown " + align + (className ? ` ${className}` : "")}>
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        +
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((tab) => (
            <button
              key={tab.id}
              className="dropdown-item"
              onClick={() => onSelect(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
