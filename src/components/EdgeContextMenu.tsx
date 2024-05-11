import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPenToSquare, FaXmark } from "react-icons/fa6";
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

  const deleteNode = () => {
    saveState();
    edge!.remove();
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
                      const reverseEdge = cyRef.current!.getElementById(`${edge!.target().id()}-${edge!.source().id()}`);
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
              <li>
                <a>
                  <button
                    className="flex gap-2 items-center justify-center"
                    onClick={deleteNode}
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
