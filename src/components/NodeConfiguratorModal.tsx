import { NodeSingular } from "cytoscape";
import React, { useState, useEffect } from "react";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

interface NodeConfiguratorModalProps {
  node: NodeSingular | null;
  close: () => void;
}

const NodeConfiguratorModal: React.FC<NodeConfiguratorModalProps> = ({ node, close }) => {
  const { saveState } = useGraphEditor();
  const [nodeTitle, setNodeTitle] = useState("");

  useEffect(() => {
   setNodeTitle(node ? node.data("title") : "");
  }, [node]);

  const saveNodeTitle = () => {
    saveState();
    node!.data({ title: nodeTitle ? nodeTitle : node?.id() });
    close();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(document.activeElement instanceof HTMLButtonElement)) {
      saveNodeTitle();
    }
  }

  return (
    <dialog id="node-configurator" className="modal" onKeyDown={handleKeyDown}>
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-ghost w-8 h-8 no-animation text-base-content text-opacity-50 hover:bg-transparent hover:text-opacity-100 absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-base">Переименование вершины</h3>
        <label className="form-control w-full py-2">
          <div className="label">
            <span className="label-text">Название вершины</span>
          </div>
          <input
            type="text"
            placeholder="Заголовок вершины"
            value={nodeTitle}
            onChange={(e) => setNodeTitle(e.target.value)}
            className="input input-md input-bordered w-full transition-all duration-150 focus:outline-0 focus:border-base-content"
          />
        </label>
        <div className="flex w-full justify-end gap-2">
          <button
            className="btn no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
            onClick={close}
          >
            Отмена
          </button>
          <button
            className="btn no-animation bg-base-content bg-opacity-90 text-base-200 hover:bg-base-content hover:bg-opacity-100"
            onClick={saveNodeTitle}
          >
            Сохранить
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default NodeConfiguratorModal;
