import { useState, useRef, useEffect } from "react";
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
  const [dynamicAlign, setDynamicAlign] = useState(align);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        setDynamicAlign("right");
      } else {
        setDynamicAlign("left");
      }
    }
  }, [isOpen]);

  return (
    <div
      className={`dropdown ${dynamicAlign}${className ? ` ${className}` : ""}`}
    >
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        +
      </button>
      {isOpen && (
        <div className="dropdown-menu" ref={dropdownRef}>
          {options.map((tab) => (
            <button
              key={tab.id}
              className="dropdown-item"
              onClick={() => {
                onSelect(tab.id);
                setIsOpen(false);
              }}
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
