import React, { useState } from "react";
import "./NetworkTablesSelect.css";
import Modal from "./Modal";
import Typeahead from "./Typeahead";
import { useNetworktables } from "../networktables/NetworkTables";

export interface NetworkTablesSelectProps {
  title: string;
  onSelect: (selected: string) => void;
}

const NetworkTablesSelect: React.FC<NetworkTablesSelectProps> = ({
  title,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { topics } = useNetworktables();

  const toggleModal = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (selected: string) => {
    onSelect(selected);
    setIsOpen(false);
  };

  return (
    <div className="networkTablesSelect">
      <button className="networkTablesSelect-toggle" onClick={toggleModal}>
        {title}
      </button>
      <Modal isOpen={isOpen} onClose={toggleModal}>
        <Typeahead
          options={topics.map((t) => t.name)}
          onSelect={handleSelect}
        />
      </Modal>
    </div>
  );
};

export default NetworkTablesSelect;
