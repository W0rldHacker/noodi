import React, { useState, useRef } from "react";
import cytoscape, {
  Core,
  ElementDefinition,
  Stylesheet,
  Position,
} from "cytoscape";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

interface ImportOrExportProps {
  cy: Core;
  close: () => void;
}

interface GraphDefinition {
  elements: ElementDefinition[];
  style?: Stylesheet;
  zoom?: number;
  pan?: Position;
}

const ImportOrExport: React.FC<ImportOrExportProps> = ({ cy, close }) => {
  const { saveGraph, saveState } = useGraphEditor();
  const [exportFormat, setExportFormat] = useState<".graph" | ".graphml">(
    ".graph"
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFileExtension = (file: File) => {
    const parts = file.name.split(".");
    if (parts.length > 1) {
      return parts.pop() || "";
    }
    return "";
  };

  const importGraph = (
    file: File,
    updateElements: (els: cytoscape.ElementDefinition[]) => void,
    clearInput: () => void
  ) => {
    console.log("это я");
    if (getFileExtension(file) === "graph") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const json = JSON.parse(event.target.result as string);
            if (!json.elements) {
              throw new Error("Файл не содержит необходимые данные о графе.");
            }
            updateElements(json.elements);
            cy.reset();
            cy.zoom(1.6);
            clearInput();
          }
        } catch (error) {
          alert(
            `Ошибка при чтении файла: ${
              error instanceof Error ? error.message : "Неизвестная ошибка"
            }`
          );
        }
      };
      reader.onerror = () => {
        alert("Ошибка при загрузке файла");
      };
      reader.readAsText(file);
    } else if (getFileExtension(file) === "graphml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            saveState();
            cy.elements().remove();
            cy.graphml({
              layoutBy: "preset"
            })
            cy.graphml(event.target!.result as string);

            cy.edges().forEach((edge) => {
              var data = edge.data();
              if (edge.data("oriented")) {
                edge.addClass("oriented");
              }
              edge.data("weight", parseFloat(edge.data("weight")));
              delete data["oriented"];
              edge.data(data);
            });

            cy.nodes().forEach((node) => {
              var data = node.data();
              const posX = node.data("x");
              const posY = node.data("y");
              if (posX !== undefined && posY !== undefined) {
                node.position({ x: parseFloat(posX), y: parseFloat(posY) });
              }
              delete data["x"];
              delete data["y"];
              node.data(data);
            });

            cy.zoom(1.6);
            cy.center();
            saveGraph();
            clearInput();
            close();
          }
        } catch (error) {
          alert(
            `Ошибка при чтении GraphML: ${
              error instanceof Error ? error.message : "Неизвестная ошибка"
            }`
          );
        }
      };
      reader.onerror = () => {
        alert("Ошибка при загрузке файла GraphML");
      };
      reader.readAsText(file);
    }
  };

  const exportGraph = (cy: Core) => {
    if (exportFormat === ".graph") {
      const json = cy.json() as GraphDefinition;
      delete json.style;
      delete json.zoom;
      delete json.pan;
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(json));
      const dlAnchorElem = document.createElement("a");
      const now = new Date();
      const uniqueName = `graph_${now.getFullYear()}${
        now.getMonth() + 1
      }${now.getDate()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", `${uniqueName}.graph`);
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      document.body.removeChild(dlAnchorElem);
    } else if (exportFormat === ".graphml") {
      cy.edges().forEach((edge) => {
        if (edge.hasClass("oriented")) {
          edge.data("oriented", "true");
        } else {
          edge.data("oriented", "false");
        }
      });
      const graphmlContent = cy.graphml();
      //console.log(graphmlContent);
      const blob = new Blob([graphmlContent], { type: "text/xml" });
      const url = URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement("a");
      const now = new Date();
      const uniqueName = `graph_${now.getFullYear()}${
        now.getMonth() + 1
      }${now.getDate()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      dlAnchorElem.setAttribute("href", url);
      dlAnchorElem.setAttribute("download", `${uniqueName}.graphml`);
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      document.body.removeChild(dlAnchorElem);
      cy.edges().forEach((edge) => {
        var data = edge.data();
        delete data["oriented"];
        edge.data(data);
      });
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current!.click();
  };

  return (
    <div className="w-full px-8 py-2 flex flex-col gap-3 text-base">
      {/*<h3 className="text-base font-semibold">Импорт/экспорт графа</h3>*/}
      <div className="border-b-[1px] border-base-content border-opacity-25 pb-3 flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Загрузить граф из файла</p>
          <p className="text-base-content text-opacity-60 text-xs">
            Поддерживаются форматы .graph и .graphml
          </p>
          <p className="text-primary text-opacity-60 text-xs leading-[14px] font-semibold">
            Это действие удалит текущий граф и заменит его на новый
          </p>
        </div>
        <button
          className="btn btn-sm text-xs no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
          onClick={handleImportButtonClick}
        >
          Загрузить
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".graph,.graphml"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              importGraph(
                e.target.files[0],
                (elements) => {
                  saveState();
                  cy.elements().remove();
                  cy.add(elements);
                  saveGraph();
                  close();
                },
                () => {
                  e.target.value = "";
                }
              );
            }
          }}
        />
      </div>
      <div className="border-b-[1px] border-base-content border-opacity-25 pb-3 flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Экспортировать граф</p>
          <p className="text-base-content text-opacity-60 text-xs">
            В файл .graph или .graphml
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm min-w-max"
            defaultValue={exportFormat}
            onChange={(e) =>
              setExportFormat(e.target.value as ".graph" | ".graphml")
            }
          >
            <option value=".graph">.graph</option>
            <option value=".graphml">.graphml</option>
          </select>
          <button
            className="btn btn-sm text-xs no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
            onClick={() => exportGraph(cy)}
          >
            Скачать
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportOrExport;
