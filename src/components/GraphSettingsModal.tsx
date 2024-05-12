import React, { useEffect, useState } from "react";
import { Core } from "cytoscape";
import ImportOrExport from "./ImportOrExport";
import AdjacencyMatrixEditor from "./AdjacencyMatrixEditor";
import IncidenceMatrixEditor from "./IncidenceMatrixEditor";

interface GraphSettingsModalProps {
  cy: Core;
}

const GraphSettingsModal: React.FC<GraphSettingsModalProps> = ({ cy }) => {
  const [selectedOption, setSelectedOption] = useState<
    "import/export" | "adjacencyMatrix" | "incidenceMatrix"
  >("import/export");

  const getSelectedTab = () => {
    switch (selectedOption) {
      case "import/export": {
        return <ImportOrExport cy={cy} close={closeGraphSettings}></ImportOrExport>;
      }
      case "adjacencyMatrix": {
        return <AdjacencyMatrixEditor cy={cy} close={closeGraphSettings}></AdjacencyMatrixEditor>;
      }
      case "incidenceMatrix": {
        return <IncidenceMatrixEditor cy={cy} close={closeGraphSettings}></IncidenceMatrixEditor>;
      }
    }
  };

  const closeGraphSettings = () => {
    const graphSettings = document.getElementById("graph-settings");
    if (graphSettings instanceof HTMLDialogElement) {
      graphSettings.close();
      setSelectedOption("import/export");
    }
  };

  return (
    <dialog id="graph-settings" className="modal">
      <div className="modal-box p-0 max-w-4xl h-[60vh] my-8 flex">
        <form method="dialog">
          <button
            className="btn btn-sm btn-ghost w-8 h-8 no-animation text-base-content text-opacity-50 hover:bg-transparent hover:text-opacity-100 absolute right-2 top-2"
            onClick={closeGraphSettings}
          >
            ✕
          </button>
        </form>
        {/*<h3 className="font-bold text-base">Настройка графа</h3>*/}
        <ul className="menu py-8 w-64 min-h-full bg-base-200 text-base-content">
          <li className="text-xs">
            <p className="menu-title text-base-content text-xs px-2">
              Настройки графа
            </p>
            <ul className="flex flex-col gap-y-0.5 mt-0.5 mx-2">
              <li>
                <a
                  className={`block p-0 ${
                    selectedOption === "import/export" ? "button-checked" : ""
                  }`}
                >
                  <button
                    className={`px-4 py-2 w-full h-full text-left rounded-md `}
                    onClick={() => setSelectedOption("import/export")}
                  >
                    Импорт/экспорт графа
                  </button>
                </a>
              </li>
              <li>
                <a
                  className={`block p-0 ${
                    selectedOption === "adjacencyMatrix" ? "button-checked" : ""
                  }`}
                >
                  <button
                    className={`px-4 py-2 w-full h-full text-left rounded-md `}
                    onClick={() => setSelectedOption("adjacencyMatrix")}
                  >
                    Матрица смежности
                  </button>
                </a>
              </li>
              <li>
                <a
                  className={`block p-0 ${
                    selectedOption === "incidenceMatrix" ? "button-checked" : ""
                  }`}
                >
                  <button
                    className={`px-4 py-2 w-full h-full text-left rounded-md `}
                    onClick={() => setSelectedOption("incidenceMatrix")}
                  >
                    Матрица инцидентности
                  </button>
                </a>
              </li>
            </ul>
          </li>
        </ul>
        <div className="flex flex-1 py-8 text-base-content">
          {getSelectedTab()}
        </div>
        {/*<div className="flex w-full justify-end gap-2">
          <button
            onClick={close}
            className="btn no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
          >
            Отмена
          </button>
          <button className="btn no-animation bg-base-content bg-opacity-90 text-base-200 hover:bg-base-content hover:bg-opacity-100">
            Сохранить
          </button>
  </div>*/}
      </div>
    </dialog>
  );
};

export default GraphSettingsModal;
