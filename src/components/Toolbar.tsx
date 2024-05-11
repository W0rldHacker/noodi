import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCirclePlus,
  FaCircleNodes,
  FaXmark,
  FaRotateRight,
  FaRotateLeft,
  FaEraser,
  FaBorderAll,
  FaSliders,
} from "react-icons/fa6";
import GraphSettingsModal from "./GraphSettingsModal";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

const Toolbar: React.FC = () => {
  const {
    cyRef,
    undoCount,
    redoCount,
    clearGraph,
    checked,
    showGrid,
    toggleGrid,
    addNodeMode,
    toggleAddNodeMode,
    addEdgeMode,
    toggleAddEdgeMode,
    deleteMode,
    toggleDeleteMode,
    undo,
    redo,
    algorithmMode,
  } = useGraphEditor();

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if (
        !algorithmMode &&
        event.ctrlKey &&
        event.altKey &&
        (event.key === "d" || event.key === "в")
      ) {
        event.preventDefault();
        clearGraph();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        event.altKey &&
        (event.key === "c" || event.key === "с")
      ) {
        event.preventDefault();
        openGraphSettings();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        (event.key === "g" || event.key === "п")
      ) {
        event.preventDefault();
        toggleGrid();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        (event.key === "v" || event.key === "м")
      ) {
        event.preventDefault();
        toggleAddNodeMode();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        (event.key === "e" || event.key === "у")
      ) {
        event.preventDefault();
        toggleAddEdgeMode();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        (event.key === "d" || event.key === "в")
      ) {
        event.preventDefault();
        toggleDeleteMode();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        (event.key === "z" || event.key === "я")
      ) {
        event.preventDefault();
        undo();
      } else if (
        !algorithmMode &&
        event.ctrlKey &&
        (event.key === "y" || event.key === "н")
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleHotkey);

    return () => {
      window.removeEventListener("keydown", handleHotkey);
    };
  }, [
    toggleGrid,
    toggleAddNodeMode,
    toggleAddEdgeMode,
    toggleDeleteMode,
    undo,
    redo,
    clearGraph,
    algorithmMode,
  ]);

  const openGraphSettings = () => {
    const graphSettings = document.getElementById("graph-settings");
    if (graphSettings instanceof HTMLDialogElement) {
      graphSettings.showModal();
    }
    close();
  };

  /*const closeGraphSettings = () => {
    const graphSettings = document.getElementById("graph-settings");
    if (graphSettings instanceof HTMLDialogElement) {
      graphSettings.close();
    }
  };*/

  /*useEffect(() => {
    setIsUndoable(undoStack.current.length > 0);
    console.log(undoStack.current.length);
    //setIsRedoable(redoStack.current.length > 0);
  }, [undoStack]);*/

  return (
    <>
      <AnimatePresence>
        {!algorithmMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ delay: 0.15, duration: 0.15 }}
            className={`absolute bottom-16 flex justify-center z-10 ${
              checked ? "" : "left-0 w-full"
            }`}
          >
            <ul className="menu menu-horizontal items-center bg-base-content text-base-200 bg-opacity-50 backdrop-blur rounded-box">
              <li>
                <a
                  className={`tooltip h-9 w-9 flex items-center justify-center ${
                    addNodeMode ? "button-checked" : ""
                  } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                  data-tip="Добавить вершину (Ctrl + V)"
                >
                  <button
                    className="p-2 rounded-lg"
                    onClick={toggleAddNodeMode}
                  >
                    <FaCirclePlus size={20} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className={`tooltip h-9 w-9 flex items-center justify-center ${
                    addEdgeMode ? "button-checked" : ""
                  } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                  data-tip="Добавить ребро (Ctrl + E)"
                >
                  <button
                    className="p-2 rounded-lg"
                    onClick={toggleAddEdgeMode}
                  >
                    <FaCircleNodes size={20} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className={`tooltip h-9 w-9 flex items-center justify-center ${
                    deleteMode ? "button-checked" : ""
                  } icon-md before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                  data-tip="Режим удаления (Ctrl + D)"
                >
                  <button className="p-2 rounded-lg" onClick={toggleDeleteMode}>
                    <FaXmark size={28} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className={`tooltip h-9 w-9 flex items-center justify-center duration-0 ${
                    undoCount > 0 ? "" : "disabled-tooltip"
                  } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                  data-tip="Отменить (Ctrl + Z)"
                >
                  <button
                    className={`p-2 rounded-lg transition-all duration-150 ${
                      undoCount > 0 ? "" : "button-disabled"
                    }`}
                    onClick={undo}
                  >
                    <FaRotateLeft size={20} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className={`tooltip h-9 w-9 flex items-center justify-center duration-0 ${
                    redoCount > 0 ? "" : "disabled-tooltip"
                  } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                  data-tip="Повторить (Ctrl + Y)"
                >
                  <button
                    className={`p-2 rounded-lg transition-all duration-150 ${
                      redoCount > 0 ? "" : "button-disabled"
                    }`}
                    onClick={redo}
                  >
                    <FaRotateRight size={20} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className="tooltip h-9 w-9 flex items-center justify-center before:bg-transparent before:text-xs before:mb-2 after:hidden"
                  data-tip="Удалить всё (Ctrl + Alt + D)"
                >
                  <button className="p-2 rounded-lg" onClick={clearGraph}>
                    <FaEraser size={20} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className={`tooltip h-9 w-9 flex items-center justify-center ${
                    showGrid ? "button-checked" : ""
                  } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                  data-tip="Скрыть/показать сетку (Ctrl + G)"
                >
                  <button className="p-2 rounded-lg" onClick={toggleGrid}>
                    <FaBorderAll size={20} />
                  </button>
                </a>
              </li>
              <div className="noodi-divider" />
              <li>
                <a
                  className="tooltip h-9 w-9 flex items-center justify-center before:bg-transparent before:text-xs before:mb-2 after:hidden"
                  data-tip="Настройка графа (Ctrl + Alt + C)"
                >
                  <button className="p-2 rounded-lg" onClick={openGraphSettings}>
                    <FaSliders size={20} />
                  </button>
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <GraphSettingsModal cy={cyRef.current!}></GraphSettingsModal>
    </>
  );
};

export default Toolbar;
