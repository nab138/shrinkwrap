import React from "react";
import Dropdown from "./Dropdown";
import "./NetworkArrayConfig.css";
import NetworkTablesSelect from "./NetworkTablesSelect";
import { NetworkTablesTypeInfo } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src";

export interface Item {
  id: string;
  type: string;
  value: string;
}

interface ItemListProps {
  availableTypes: string[];
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  label: string;
  types?: NetworkTablesTypeInfo[] | null;
}

const ItemList: React.FC<ItemListProps> = ({
  availableTypes,
  items,
  onItemsChange,
  label,
  types = null,
}) => {
  const addItem = (type: string) => {
    const newItem: Item = {
      id: Math.random().toString(36).substr(2, 9),
      type: type,
      value: "",
    };
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
              types={types ?? null}
              onSelect={(selected) => {
                const updatedItems = items.map((i) =>
                  i.id === item.id ? { ...i, value: selected } : i
                );
                onItemsChange(updatedItems);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;
