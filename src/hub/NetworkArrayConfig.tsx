import React from "react";
import Dropdown from "./Dropdown";

interface Item {
  id: string;
  type: string;
}

interface ItemListProps {
  availableTypes: string[];
  items: Item[];
  onItemsChange: (items: Item[]) => void;
}

const ItemList: React.FC<ItemListProps> = ({
  availableTypes,
  items,
  onItemsChange,
}) => {
  const addItem = (type: string) => {
    const newItem: Item = {
      id: Math.random().toString(36).substr(2, 9),
      type: type,
    };
    const updatedItems = [...items, newItem];
    onItemsChange(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    onItemsChange(updatedItems);
  };

  return (
    <div>
      <div>
        <Dropdown
          options={availableTypes.map((type) => ({ id: type, title: type }))}
          onSelect={addItem}
        />
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.type}
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;
