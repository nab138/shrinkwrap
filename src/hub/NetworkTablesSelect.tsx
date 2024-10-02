import React, { useState } from "react";
import "./NetworkTablesSelect.css";
import Modal from "./Modal";
import Typeahead from "./Typeahead";
import { useNetworktables } from "../networktables/NetworkTables";

export interface NetworkTablesSelectProps {
  onSelect: (selected: string) => void;
}

const NetworkTablesSelect: React.FC<NetworkTablesSelectProps> = ({
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const { topics } = useNetworktables();

  const toggleModal = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (selected: string) => {
    onSelect(selected);
    setSelected(selected);
    setIsOpen(false);
  };

  return (
    <div className="networkTablesSelect">
      <button className="networkTablesSelect-toggle" onClick={toggleModal}>
        {selected || "Select a topic..."}
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
