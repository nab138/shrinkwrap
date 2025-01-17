import React from "react";
import Dropdown from "./Dropdown";
import "./NetworkArrayConfig.css";
import NetworkTablesSelect from "./NetworkTablesSelect";

export interface Item {
  id: string;
  type: string;
  value: string;
  options?: Option[];
}

export interface Option {
  type: "color" | "number";
  value: string;
  label: string;
}

interface ItemListProps {
  availableTypes: string[];
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  label: string;
  types?: string[] | null;
  defaultOptions?: { [key: string]: Option[] };
}

const ItemList: React.FC<ItemListProps> = ({
  availableTypes,
  items,
  onItemsChange,
  label,
  types = null,
  defaultOptions = {},
}) => {
  const addItem = (type: string) => {
    const newItem: Item = {
      id: Math.random().toString(36).substr(2, 9),
      type: type,
      value: "",
    };
    if (defaultOptions[type]) {
      newItem.options = defaultOptions[type];
    }
    const updatedItems = [...items, newItem];
    onItemsChange(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    onItemsChange(updatedItems);
  };

  return (
    <div className="arrayConfig">
      <div className="listDropdownContainer">
        <label>{label}</label>
        <Dropdown
          options={availableTypes.map((type) => ({ id: type, title: type }))}
          onSelect={addItem}
        />
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="arrayItem">
            <div className="arrayItemName">
              {item.type}
              <button onClick={() => removeItem(item.id)}>🗑️</button>
            </div>
            <NetworkTablesSelect
              defaultSelected={item.value}
              types={types ?? undefined}
              onSelect={(selected) => {
                const updatedItems = items.map((i) =>
                  i.id === item.id ? { ...i, value: selected } : i
                );
                onItemsChange(updatedItems);
              }}
            />
            {item.options &&
              item.options.map((option) => {
                switch (option.type) {
                  case "color":
                    return (
                      <div
                        key={option.label + option.type}
                        className="itemOption"
                      >
                        <label>{option.label}</label>
                        <input
                          type="color"
                          value={option.value}
                          onChange={(e) => {
                            const updatedItems = items.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    options: i.options?.map((o) =>
                                      o.label === option.label
                                        ? { ...o, value: e.target.value }
                                        : o
                                    ),
                                  }
                                : i
                            );
                            onItemsChange(updatedItems);
                          }}
                        />
                      </div>
                    );
                  case "number":
                    return (
                      <div
                        key={option.label + option.type}
                        className="itemOption"
                      >
                        <label>{option.label}</label>
                        <input
                          type="number"
                          value={option.value}
                          step={0.1}
                          onChange={(e) => {
                            const updatedItems = items.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    options: i.options?.map((o) =>
                                      o.label === option.label
                                        ? { ...o, value: e.target.value }
                                        : o
                                    ),
                                  }
                                : i
                            );
                            onItemsChange(updatedItems);
                          }}
                        />
                      </div>
                    );
                }
              })}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;
