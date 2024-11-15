import React, { useContext, useEffect, useState } from "react";
import "./NetworkTablesSelect.css";
import Modal from "./Modal";
import Typeahead from "./Typeahead";
import NTContext from "../ntcore-react/NTContext";
import { NetworkTablesTypeInfo } from "ntcore-ts-client";

export interface NetworkTablesSelectProps {
  onSelect: (selected: string) => void;
  defaultSelected?: string;
  types?: NetworkTablesTypeInfo[] | null;
}

const NetworkTablesSelect: React.FC<NetworkTablesSelectProps> = ({
  onSelect,
  defaultSelected = "",
  types = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultSelected);
  const { topics } = useContext(NTContext);
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
      const newValidTopics = topics
        .filter((topic) => {
          if (!types) return true;
          return types.some((type) => type[0] === topic.type[0]);
        })
        .map((topic) => topic.name);
      setValidTopics(newValidTopics);
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
