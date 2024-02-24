import React, { useState, useEffect } from "react";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

const ZoomSlider: React.FC= () => {
  const { cyRef } = useGraphEditor();
  const [zoomValue, setZoomValue] = useState(cyRef.current!.zoom());

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.on("zoom", () => {
        setZoomValue(cyRef.current!.zoom());
      });
    }
  }, [cyRef]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoomValue = parseFloat(e.target.value);
    setZoomValue(newZoomValue);
    if (cyRef.current) {
      const container = cyRef.current.container();
      const centerPosition = {
        x: container!.offsetWidth / 2,
        y: container!.offsetHeight / 2,
      };
      cyRef.current.zoom({
        level: newZoomValue,
        renderedPosition: centerPosition,
      });
    }
  };

  return (
    <div className="absolute -right-32 -rotate-90 h-4 flex items-center justify-center gap-4 z-10">
      <span className="h-full text-2xl text-base-content pb-7 rotate-90">-</span>
      <input
        type="range"
        min={cyRef.current!.minZoom()}
        max={cyRef.current!.maxZoom()}
        value={zoomValue}
        step="0.01"
        onChange={handleSliderChange}
        className="range range-xs range-zoom w-64 rounded-none"
      />
      <span className="h-full text-2xl text-base-content pb-7">+</span>
    </div>
  );
};

export default ZoomSlider;
