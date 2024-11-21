import React, { useEffect, useState } from "react";
import "./NetworkTablesSelect.css";
import Modal from "./Modal";
import Typeahead from "./Typeahead";
import useNTTopics from "../ntcore-react/useNTTopics";

export interface NetworkTablesSelectProps {
  onSelect: (selected: string) => void;
  defaultSelected?: string;
  types?: string[];
}

const NetworkTablesSelect: React.FC<NetworkTablesSelectProps> = ({
  onSelect,
  defaultSelected = "",
  types = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultSelected);
  const topics = useNTTopics();
  const [validTopics, setValidTopics] = useState<string[]>([]);

  const toggleModal = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (selected: string) => {
    onSelect(selected);
    setSelected(selected);
    setIsOpen(false);
  };

  useEffect(() => {
    if (topics) {
      let valid: string[] = [];
      topics.forEach((topic) => {
        if (!types) return;
        if (types.includes(topic.type)) {
          valid.push(topic.name);
        }
      });
      setValidTopics(valid);
    }
  }, [topics, types]);

  return (
    <div className="networkTablesSelect">
      <button className="networkTablesSelect-toggle" onClick={toggleModal}>
        {selected || "Select a topic..."}
      </button>
      <Modal isOpen={isOpen} onClose={toggleModal}>
        <Typeahead options={validTopics} onSelect={handleSelect} />
      </Modal>
    </div>
  );
};

export default NetworkTablesSelect;
