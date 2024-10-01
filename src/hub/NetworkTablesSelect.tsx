import React, { useState } from "react";
import "./NetworkTablesSelect.css";
import Modal from "./Modal";
import Typeahead from "./Typeahead";

export interface NetworkTablesSelectProps {
  title: string;
  options: string[];
  onSelect: (selected: string) => void;
}

const NetworkTablesSelect: React.FC<NetworkTablesSelectProps> = ({
  title,
  options,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
        <Typeahead options={options} onSelect={handleSelect} />
      </Modal>
    </div>
  );
};

export default NetworkTablesSelect;
