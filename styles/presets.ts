// styles/presets.ts
export const classicStyle = {
    node: {
      backgroundColor: "#ffffff",
      borderColor: "#cccccc",
      borderRadius: 8,
      font: "Noto Sans",
      shadow: false,
    },
    edge: {
      stroke: "#888",
      type: "default",
    },
  };
  
  export const brutalistStyle = {
    node: {
      backgroundColor: "#fdf04a",
      borderColor: "#000000",
      borderRadius: 0,
      font: "Courier New",
      shadow: true,
    },
    edge: {
      stroke: "#000",
      type: "straight",
    },
  };
  
  export const cuteStyle = {
    node: {
      backgroundColor: "#ffe4ec",
      borderColor: "#f39ac7",
      borderRadius: 16,
      font: "'Comic Sans MS', cursive",
      shadow: true,
    },
    edge: {
      stroke: "#f39ac7",
      type: "step",
    },
  };
  