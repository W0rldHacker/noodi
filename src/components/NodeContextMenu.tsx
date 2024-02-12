import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPenToSquare, FaXmark } from "react-icons/fa6";
import { NodeSingular } from "cytoscape";
import RenameNodeModal from "./NodeConfiguratorModal";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

interface NodeContextMenuProps {
  position: { x: number; y: number } | null;
  node: NodeSingular | null;
  close: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  position,
  node,
  close,
}) => {
  const { saveGraph, saveState } = useGraphEditor();
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

  const openNodeConfigurator = () => {
    const nodeConfigurator = document.getElementById("node-configurator");
    if (nodeConfigurator instanceof HTMLDialogElement) {
      nodeConfigurator.showModal();
    }
    close();
  };

  const closeNodeConfigurator = () => {
    const nodeConfigurator = document.getElementById("node-configurator");
    if (nodeConfigurator instanceof HTMLDialogElement) {
      nodeConfigurator.close();
    }
  };

  const deleteNode = () => {
    saveState();
    node!.remove();
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
            style={{ top: position!.y, left: position!.x }}
          >
            <ul className="menu menu-sm bg-base-200 rounded-box">
              <li>
                <a>
                  <button
                    className="flex gap-2 items-center justify-center"
                    onClick={openNodeConfigurator}
                  >
                    <span>
                      <FaPenToSquare size={16}></FaPenToSquare>
                    </span>
                    Переименовать вершину
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
                    Удалить вершину
                  </button>
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <RenameNodeModal node={node!} close={closeNodeConfigurator} />
    </>
  );
};

export default NodeContextMenu;
