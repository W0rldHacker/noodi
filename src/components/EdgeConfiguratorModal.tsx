import React, { useState, useEffect, useRef } from "react";
import { useGraphEditor } from "@/contexts/GraphEditorContext";
import { Core, EdgeSingular } from "cytoscape";
import { reverse } from "dns";

interface EdgeConfiguratorModalProps {
  defaultConfig: {
    mode: "create" | "edit" | "replace";
    cy: Core | null;
    sourceId: string | null;
    targetId: string | null;
    reverseEdge: EdgeSingular | null;
    edgeTitle: string;
    edgeWeight: number;
    displayedEdgeWeight: string;
    isOriented: boolean;
  };
  close: () => void;
}

const EdgeConfiguratorModal: React.FC<EdgeConfiguratorModalProps> = ({
  defaultConfig,
  close,
}) => {
  const [edgeTitle, setEdgeTitle] = useState("");
  const edgeWeight = useRef(1);
  const displayedEdgeWeight = useRef("");
  const [edgeWeightString, setEdgeWeightString] = useState("");
  const [isOriented, setIsOriented] = useState(true);
  const [isLoop, setIsLoop] = useState(false);
  const { saveGraph, saveState } = useGraphEditor();

  useEffect(() => {
    setEdgeTitle(defaultConfig.edgeTitle);
    edgeWeight.current = defaultConfig.edgeWeight;
    displayedEdgeWeight.current = defaultConfig.displayedEdgeWeight || "";
    setEdgeWeightString(defaultConfig.displayedEdgeWeight || "");
    setIsOriented(defaultConfig.isOriented);
    setIsLoop(defaultConfig.sourceId === defaultConfig.targetId);
  }, [defaultConfig]);

  const handleEdgeWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^-?\d*(\.|,)?\d*$/.test(value) || value === "") {
      setEdgeWeightString(value);
    }
  };

  const createEdge = () => {
    const addEdge = () => {
      defaultConfig.cy!.add({
        group: "edges",
        data: {
          id: `${defaultConfig.sourceId}-${defaultConfig.targetId}`,
          source: defaultConfig.sourceId,
          target: defaultConfig.targetId,
          title: edgeTitle,
          weight: edgeWeight.current,
          displayedWeight: displayedEdgeWeight.current,
        },
        classes: isOriented ? "oriented" : "",
      });
    };

    if (defaultConfig.reverseEdge !== null) {
      if (edgeWeight.current === defaultConfig.reverseEdge.data("weight")) {
        defaultConfig.reverseEdge.removeClass("oriented");
        if (defaultConfig.mode === "replace") {
          addEdge();
        }
      }
      else {
        addEdge();
      }
    } else {
      addEdge();
    }
  };

  const removeDuplicateEdges = () => {
    const edgePairs = new Map<string, cytoscape.EdgeSingular>();

    defaultConfig.cy!.edges().forEach((edge) => {
      const sourceId = edge.source().id();
      const targetId = edge.target().id();
      const weight = edge.data("weight");
      const key =
        sourceId < targetId
          ? `${sourceId}-${targetId}`
          : `${targetId}-${sourceId}`;

      if (edgePairs.has(key)) {
        const existingEdge = edgePairs.get(key);
        if (existingEdge && existingEdge.data("weight") === weight) {
          defaultConfig.cy!.remove(existingEdge);
        }
      } else {
        edgePairs.set(key, edge);
      }
    });
  }

  const saveEdgeWeight = () => {
    if (edgeWeightString) {
      const number = Number(edgeWeightString.replace(",", "."));
      if (!Number.isNaN(number)) {
        edgeWeight.current = number === -0 ? 0 : number;
        displayedEdgeWeight.current = number === -0 ? "0" : number.toString();
      } else {
        edgeWeight.current = 1;
        displayedEdgeWeight.current = "";
      }
    } else {
      edgeWeight.current = 1;
      displayedEdgeWeight.current = "";
    }

    //console.log(defaultConfig.reverseEdge?.hasClass("oriented"));

    /*if (defaultConfig.mode === "create") {
      if ((defaultConfig.reverseEdge !== null) && !isOriented) {
        defaultConfig.reverseEdge.data({ title: edgeTitle, weight: edgeWeight.current, displayedWeight: displayedEdgeWeight.current });
        defaultConfig.reverseEdge.classes("");
      } else if ((defaultConfig.reverseEdge !== null) && isOriented) {
        createEdge();
      } else if (defaultConfig.reverseEdge === null) {
        createEdge();
      }
    } else if (defaultConfig.mode === "edit") {
      defaultConfig.cy!.elements(`#${defaultConfig.sourceId}-${defaultConfig.targetId}`).data({ title: edgeTitle, weight: edgeWeight.current, displayedWeight: displayedEdgeWeight.current });
      defaultConfig.cy!.elements(`#${defaultConfig.sourceId}-${defaultConfig.targetId}`).classes(isOriented ? "oriented" : "");
    } else {
      defaultConfig.reverseEdge!.remove();
      createEdge();
    }*/

    saveState();

    switch (defaultConfig.mode) {
      case "create": {
        createEdge();
        break;
      }
      case "edit": {
        defaultConfig
          .cy!.elements(`#${defaultConfig.sourceId}-${defaultConfig.targetId}`)
          .data({
            title: edgeTitle,
            weight: edgeWeight.current,
            displayedWeight: displayedEdgeWeight.current,
          });
        defaultConfig
          .cy!.elements(`#${defaultConfig.sourceId}-${defaultConfig.targetId}`)
          .classes(isOriented ? "oriented" : "");
        if (
          defaultConfig.reverseEdge !== null &&
          edgeWeight.current === defaultConfig.reverseEdge.data("weight")
        ) {
          if (defaultConfig.sourceId !== defaultConfig.targetId) {
            defaultConfig.reverseEdge.remove();
            defaultConfig
              .cy!.elements(
                `#${defaultConfig.sourceId}-${defaultConfig.targetId}`
              )
              .removeClass("oriented");
          }
        }
        break;
      }
      case "replace": {
        defaultConfig.reverseEdge?.remove();
        createEdge();
        break;
      }
    }

    saveGraph();

    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(document.activeElement instanceof HTMLButtonElement)) {
      saveEdgeWeight();
    }
  }

  return (
    <dialog id="edge-configurator" className="modal" onKeyDown={handleKeyDown}>
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-ghost w-8 h-8 no-animation text-base-content text-opacity-50 hover:bg-transparent hover:text-opacity-100 absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-base">
          {(defaultConfig.mode === "create" ? "Создание" : "Редактирование") +
            " ребра"}
        </h3>
        <label className="form-control w-full py-2">
          <div className="label">
            <span className="label-text">Название ребра (необязательно)</span>
          </div>
          <input
            type="text"
            placeholder="Заголовок ребра"
            value={edgeTitle}
            onChange={(e) => setEdgeTitle(e.target.value)}
            className="input input-md input-bordered w-full transition-all duration-150 focus:outline-0 focus:border-base-content"
          />
        </label>
        <label className="form-control w-full py-2">
          <div className="label">
            <span className="label-text">
              Вес ребра (оставьте пустым, если ребро невзвешенное)
            </span>
          </div>
          <input
            type="text"
            placeholder="Вес ребра"
            value={edgeWeightString}
            onChange={handleEdgeWeightChange}
            className="input input-md input-bordered w-full transition-all duration-150 focus:outline-0 focus:border-base-content"
          />
        </label>
        <div className="flex w-full justify-evenly py-2">
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Ориентированное</span>
              <input
                type="radio"
                name="radio"
                checked={isOriented}
                onChange={() => setIsOriented(true)}
                className="radio checked:bg-base-content"
              />
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Неориентированное</span>
              <input
                type="radio"
                name="radio"
                checked={!isOriented}
                onChange={() => setIsOriented(false)}
                className="radio checked:bg-base-content disabled:opacity-60"
                disabled={defaultConfig.reverseEdge !== null && defaultConfig.reverseEdge.hasClass("oriented") && !isLoop}
              />
            </label>
          </div>
        </div>
        <div className="flex w-full justify-end gap-2">
          <button
            onClick={close}
            className="btn no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
          >
            Отмена
          </button>
          <button
            onClick={saveEdgeWeight}
            className="btn no-animation bg-base-content bg-opacity-90 text-base-200 hover:bg-base-content hover:bg-opacity-100"
          >
            Сохранить
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default EdgeConfiguratorModal;
