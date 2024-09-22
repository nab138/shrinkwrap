import React, { useEffect, useRef } from "react";
import "golden-layout/src/css/goldenlayout-light-theme.css";
import { GoldenLayout, ComponentContainer, JsonValue } from "golden-layout";

interface TabState {
  title: string;
}

class TabComponent {
  constructor(
    container: ComponentContainer,
    state: JsonValue | undefined,
    virtual: boolean
  ) {
    const tabState = state as TabState | undefined;
    container.element.innerHTML = `<div>Content for ${
      tabState?.title || "Tab"
    }</div>`;
  }
}

function App() {
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (layoutRef.current) {
      const layout = new GoldenLayout(layoutRef.current);

      layout.registerComponentConstructor("tab1", TabComponent);
      layout.registerComponentConstructor("tab2", TabComponent);
      layout.registerComponentConstructor("newTab", TabComponent);

      layout.on("initialised", () => {
        layout.root.contentItems[0].addChild({
          type: "component",
          componentType: "tab1",
          title: "Tab 1",
        });
        layout.root.contentItems[0].addChild({
          type: "component",
          componentType: "tab2",
          title: "Tab 2",
        });
      });

      layout.init();
    }
  }, []);

  const addNewTab = (tabTitle: string) => {
    if (layoutRef.current) {
      const layout = new GoldenLayout(layoutRef.current);
      layout.registerComponentConstructor("newTab", TabComponent);

      layout.on("initialised", () => {
        layout.root.contentItems[0].addChild({
          type: "component",
          componentType: "newTab",
          title: tabTitle,
        });
      });

      layout.init();
    }
  };

  return (
    <div>
      <div
        ref={layoutRef}
        style={{ width: "100%", height: "400px", position: "relative" }}
      ></div>
      <div>
        <button onClick={() => addNewTab("New Tab")}>Add New Tab</button>
        <button onClick={() => addNewTab("Custom Tab")}>Add Custom Tab</button>
      </div>
    </div>
  );
}

export default App;
