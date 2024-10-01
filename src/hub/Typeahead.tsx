import React, { useState } from "react";
import "./Typeahead.css";

interface TypeaheadProps {
  options: string[];
  onSelect: (selected: string) => void;
}

const Typeahead: React.FC<TypeaheadProps> = ({ options, onSelect }) => {
  const [query, setQuery] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="typeahead">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="typeahead-input"
      />
      {filteredOptions.length > 0 && (
        <ul className="typeahead-list">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className="typeahead-item"
              onClick={() => onSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Typeahead;
