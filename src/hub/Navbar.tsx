import React, { useState } from "react";
import { tabsConfig } from "../tabsConfig";
import "./Navbar.css";

export interface NavbarProps {
  openTab: (tabId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ openTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        +
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {tabsConfig.map((tab) => (
            <button
              key={tab.id}
              className="dropdown-item"
              onClick={() => openTab(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
