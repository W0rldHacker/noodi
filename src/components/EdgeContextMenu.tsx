import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPenToSquare, FaXmark, FaRightLeft } from "react-icons/fa6";
import { FaLongArrowAltRight } from "react-icons/fa";
import { EdgeSingular } from "cytoscape";
import { useGraphEditor } from "@/contexts/GraphEditorContext";
import { useEdgeConfigurator } from "@/contexts/EdgeConfiguratorContext";

interface EdgeContextMenuProps {
  position: { x: number; y: number } | null;
  edge: EdgeSingular | null;
  close: () => void;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  position,
  edge,
  close,
}) => {
  const { saveGraph, saveState, cyRef } = useGraphEditor();
  const { openEdgeConfigurator } = useEdgeConfigurator();
  const [reverseEdge, setReverseEdge] = useState<EdgeSingular | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [close]);

  useEffect(() => {
    if (edge !== null) {
      const sourceId = edge.source().id();
      const targetId = edge.target().id();
      const reverseEdgeId = `${targetId}-${sourceId}`;
      const reverseEdge = cyRef.current!.getElementById(reverseEdgeId);
      if (reverseEdge.length > 0) {
        setReverseEdge(reverseEdge);
      } else {
        setReverseEdge(null);
      }
    }
  }, [cyRef, edge]);

  const deleteEdge = () => {
    saveState();
    edge!.remove();
    saveGraph();
    close();
  };

  const flipEdge = () => {
    saveState();
    const sourceId = edge!.source().id();
    const targetId = edge!.target().id();
    const isOriented = edge!.hasClass("oriented");
    cyRef.current!.add({
      group: "edges",
      data: {
        id: `${targetId}-${sourceId}`,
        source: targetId,
        target: sourceId,
        title: edge!.data("title"),
        weight: edge!.data("weight"),
        displayedWeight: edge!.data("displayedWeight"),
      },
      classes: isOriented ? "oriented" : "",
    });
    edge!.remove();
    saveGraph();
    close();
  };

  const toggleEdgeOrientation = () => {
    saveState();
    if (edge!.hasClass("oriented")) {
      edge!.removeClass("oriented");
    } else {
      edge!.addClass("oriented");
    }
    saveGraph();
    close();
  };

  return (
    <>
      <AnimatePresence>
        {position && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute min-w-max"
            style={{ top: position.y, left: position.x }}
          >
            <ul className="menu menu-sm bg-base-200 rounded-box">
              <li>
                <a>
                  <button
                    className="flex gap-2 items-center justify-center"
                    onClick={() => {
                      const reverseEdge = cyRef.current!.getElementById(
                        `${edge!.target().id()}-${edge!.source().id()}`
                      );
                      openEdgeConfigurator(
                        "edit",
                        cyRef.current!,
                        edge!.source().id(),
                        edge!.target().id(),
                        reverseEdge.length > 0 ? reverseEdge : undefined,
                        edge!.data("title"),
                        edge!.data("weight"),
                        edge!.data("displayedWeight"),
                        edge!.hasClass("oriented")
                      );
                      close();
                    }}
                  >
                    <span>
                      <FaPenToSquare size={16}></FaPenToSquare>
                    </span>
                    Редактировать ребро
                  </button>
                </a>
              </li>
              {edge && reverseEdge === null && edge.hasClass("oriented") ? (
                <li>
                  <a>
                    <button
                      className="flex gap-2 items-center justify-center"
                      onClick={flipEdge}
                    >
                      <span className="h-4 w-4 flex items-center justify-center">
                        <FaRightLeft size={18}></FaRightLeft>
                      </span>
                      Изменить направление
                    </button>
                  </a>
                </li>
              ) : (
                <></>
              )}
              <li>
                <a>
                  <button
                    className="flex gap-2 items-center justify-center"
                    onClick={toggleEdgeOrientation}
                  >
                    <span className="h-4 w-4 flex items-center justify-center">
                      {edge!.hasClass("oriented") ? (
                        <svg
                          id="_Слой_1"
                          data-name="Слой 1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 448.05 358.04"
                          className="fill-base-content"
                        >
                          <path d="m415.95,355.62L4.62,37.7c-4.89-3.78-5.73-10.84-1.96-15.73L16.37,4.34c3.78-4.89,10.84-5.8,15.73-1.96l411.33,317.92c4.89,3.78,5.73,10.84,1.96,15.73l-13.7,17.69c-3.78,4.89-10.84,5.73-15.73,1.96v-.07Z" />
                          <g>
                            <path d="m441,162.12l-86.1-86.1c-15.1-15.1-41-4.4-41,17v46h-177.74l103.51,80h74.23v46.1c0,6.37,2.31,11.78,5.93,15.86l7.09,5.48c8.65,4.43,19.87,3.77,27.98-4.34l86.1-86.1c9.4-9.4,9.4-24.6,0-33.9Z" />
                            <path d="m63,139.02H12c-6.6,0-12,5.4-12,12v56c0,6.6,5.4,12,12,12h154.5l-103.51-80Z" />
                          </g>
                        </svg>
                      ) : (
                        <FaLongArrowAltRight size={18}></FaLongArrowAltRight>
                      )}
                    </span>
                    Сделать{" "}
                    {edge!.hasClass("oriented")
                      ? "неориентированным"
                      : "ориентированным"}
                  </button>
                </a>
              </li>
              <li>
                <a>
                  <button
                    className="flex gap-2 items-center justify-center"
                    onClick={deleteEdge}
                  >
                    <span className="h-4 w-4 flex items-center justify-center">
                      <FaXmark size={18}></FaXmark>
                    </span>
                    Удалить ребро
                  </button>
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EdgeContextMenu;
