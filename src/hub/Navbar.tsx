import React from "react";
import { tabsConfig } from "../tabsConfig";
import "./Navbar.css";
import Dropdown from "./Dropdown";

export interface NavbarProps {
  openTab: (tabId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ openTab }) => {
  return (
    <div className="navbar">
      <Dropdown
        className="navbar-dropdown"
        options={tabsConfig.map((tab) => ({ id: tab.id, title: tab.title }))}
        onSelect={openTab}
      />
    </div>
  );
};

export default Navbar;
