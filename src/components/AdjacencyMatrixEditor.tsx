import React, { useState, useEffect } from "react";
import { Core } from "cytoscape";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

interface AdjacencyMatrixEditorProps {
  cy: Core;
  close: () => void;
}

const parseMatrix = (input: string) => {
  return input.split("\n").map((row) => row.trim().split(/\s+/).map(Number));
};

const formatMatrix = (matrix: number[][]) => {
  return matrix.map((row) => row.join(" ")).join("\n");
};

const createAdjacencyMatrix = (cy: Core) => {
  const nodes = cy.nodes().map((node) => node.id()).sort(
    (a, b) => Number(a) - Number(b)
  );
  const edges = cy.edges().map((edge) => ({
    id: edge.id(),
    weight: edge.data("weight"),
    source: edge.data("source"),
    target: edge.data("target"),
    oriented: edge.hasClass("oriented"),
  }));

  const matrix: number[][] = [];
  //const edgeIds: (string | null)[][] = [];
  nodes.forEach((_, i) => {
    matrix[i] = Array(nodes.length).fill(0);
    //edgeIds[i] = Array(nodes.length).fill(null);
  });

  edges.forEach((edge) => {
    const srcIndex = nodes.indexOf(edge.source);
    const tgtIndex = nodes.indexOf(edge.target);
    if (edge.oriented) {
      matrix[srcIndex][tgtIndex] = edge.weight;
      //edgeIds[srcIndex][tgtIndex] = edge.id;
    } else {
      matrix[srcIndex][tgtIndex] = edge.weight;
      matrix[tgtIndex][srcIndex] = edge.weight;
      //edgeIds[srcIndex][tgtIndex] = edge.id;
      //edgeIds[tgtIndex][srcIndex] = edge.id;
    }
  });

  return { matrix, nodes };
};

const AdjacencyMatrixEditor: React.FC<AdjacencyMatrixEditorProps> = ({
  cy,
  close,
}) => {
  const { matrix, nodes } = createAdjacencyMatrix(cy);
  //const [nodeIds, setNodeIds] = useState(nodes);
  const [isValidMatrix, setIsValidMatrix] = useState(true);
  const [matrixString, setMatrixString] = useState<string>(
    formatMatrix(matrix)
  );
  const [adjacencyMatrix, setAdjacencyMatrix] = useState<number[][]>(matrix);
  const { saveGraph, saveState } = useGraphEditor();

  const handleMatrixChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMatrixString(event.target.value);
    setAdjacencyMatrix(parseMatrix(event.target.value));
  };

  const validateMatrix = (matrix: number[][]): boolean => {
    const N = matrix.length;
    for (let i = 0; i < N; i++) {
      if (matrix[i].length !== N) return false;
      for (let j = 0; j < N; j++) {
        if (typeof matrix[i][j] !== "number" || isNaN(matrix[i][j]))
          return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const isValid = validateMatrix(adjacencyMatrix);
    setIsValidMatrix(isValid);
  }, [adjacencyMatrix]);

  const isWeighted = (matrix: number[][]) => {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] !== 0 && matrix[i][j] !== 1) {
          return true;
        }
      }
    }
    return false;
  };

  const removeDuplicateEdges = () => {
    const edgePairs = new Map<string, cytoscape.EdgeSingular>();

    cy.edges().forEach((edge) => {
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
          // Удаляем одно из рёбер, если веса совпадают
          cy.remove(existingEdge);
        }
      } else {
        edgePairs.set(key, edge);
      }
    });
  };

  const getNewNodeIds = (matrix: number[][]) => {
    const nodeIds: string[] = [];
    for (let i = 1; i <= matrix.length; i++) {
      nodeIds.push(i.toString());
    }
    return nodeIds;
  };

  const updateGraphFromMatrix = (
    cy: Core,
    matrix: number[][],
    nodeIds: string[]
  ) => {
    const isWeightedGraph = isWeighted(matrix);
    saveState();

    const nodesCount = cy.nodes().length;

    if (nodesCount !== matrix.length) {
      cy.elements().remove();
      nodeIds = getNewNodeIds(matrix);
      nodeIds.forEach((id) =>
        cy.add({ group: "nodes", data: { id: id, title: id.toString() } })
      );
    }

    nodeIds.forEach((sourceId, i) => {
      nodeIds.forEach((targetId, j) => {
        const weight = matrix[i][j];
        if (weight !== 0) {
          const edgeId = `${sourceId}-${targetId}`;
          const reverseEdgeId = `${targetId}-${sourceId}`;
          let edge = cy.getElementById(edgeId);
          let reverseEdge = cy.getElementById(reverseEdgeId);

          if (i != j && matrix[j][i] === weight) {
            if (reverseEdge.length > 0) {
              reverseEdge.data("weight", weight);
              reverseEdge.data(
                "displayedWeight",
                isWeightedGraph ? weight.toString() : ""
              );
              if (reverseEdge.hasClass("oriented")) {
                reverseEdge.removeClass("oriented");
              }
            } else if (edge.length === 0) {
              cy.add({
                group: "edges",
                data: {
                  id: edgeId,
                  source: sourceId,
                  target: targetId,
                  weight: weight,
                  displayedWeight: isWeightedGraph ? weight.toString() : "",
                },
              });
            } else {
              edge.data("weight", weight);
              edge.data(
                "displayedWeight",
                isWeightedGraph ? weight.toString() : ""
              );
              if (edge.hasClass("oriented")) {
                edge.removeClass("oriented");
              }
            }
          } else {
            if (edge.length === 0) {
              cy.add({
                group: "edges",
                data: {
                  id: edgeId,
                  source: sourceId,
                  target: targetId,
                  weight: weight,
                  displayedWeight: isWeightedGraph ? weight.toString() : "",
                },
              });
              if (sourceId !== targetId) {
                cy.getElementById(edgeId).addClass("oriented");
              }
            } else {
              edge.data("weight", weight);
              edge.data(
                "displayedWeight",
                isWeightedGraph ? weight.toString() : ""
              );
              if (!edge.hasClass("oriented")) {
                edge.addClass("oriented");
              }
            }
          }

          /*if (edge.length === 0 && reverseEdge.length === 0) {
            // Добавить новое ребро, если его нет
            cy.add({
              group: "edges",
              data: { id: edgeId, source: sourceId, target: targetId, weight: weight, displayedWeight: weight.toString() },
            });
          } else {
            // Обновить вес существующего ребра
            if (edge.length) {
                edge.data("weight", weight);
                edge.data("displayedWeight", weight.toString());
            } else if (reverseEdge.length) {
                reverseEdge.data("weight", weight);
                reverseEdge.data("displayedWeight", weight.toString());
            }
          }*/
        }
      });
    });

    // Удаление рёбер, которых нет в новой матрице
    cy.edges().forEach((edge) => {
      const sourceIndex = nodeIds.indexOf(edge.data("source"));
      const targetIndex = nodeIds.indexOf(edge.data("target"));
      if (matrix[sourceIndex][targetIndex] === 0) {
        cy.remove(edge);
      }
    });

    removeDuplicateEdges();

    if (nodesCount !== matrix.length) {
      let layout = cy.layout({ name: "cose" });
      layout.run();
      cy.zoom(1.6);
      cy.center();
      layout.on("layoutstop", () => {
        saveGraph();
        close();
      });
    } else {
      cy.zoom(1.6);
      cy.center();
      saveGraph();
      close();
    }

    /*cy.edges().forEach((edge) => {
        const source = edge.source().id();
        const target = edge.target().id();
        if (source !== target) {
            const reverseEdge = cy.getElementById(`${edge.data("target")}-${edge.data("source")}`);
            if (reverseEdge.length > 0 && reverseEdge.data("weight") === edge.data("weight")) {
                reverseEdge.remove();
            }
        }
    });*/
  };

  return (
    <div className="w-full px-8 py-2 flex flex-col gap-3 text-base">
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">Матрица смежности графа</p>
        <p className="text-base-content text-opacity-60 text-xs">
          Напишите матрицу смежности или измените уже существующую в поле ниже,
          а затем нажмите на кнопку &quot;Сохранить&quot;, чтобы применить
          изменения
        </p>
      </div>
      <textarea
        className="textarea textarea-bordered textarea-md w-full h-full resize-none text-base tracking-widest"
        value={matrixString}
        onChange={handleMatrixChange}
      />
      <div className="flex w-full justify-center">
        <div className={`tooltip before:text-xs before:bg-base-300 after:text-base-300 ${isValidMatrix ? "before:hidden after:hidden" : ""}`} data-tip={isValidMatrix ? "" : "Матрица смежности содержит некорректные данные или имеет некорректный формат"}>
          <button
            className="btn btn-sm text-xs no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
            onClick={() => updateGraphFromMatrix(cy, adjacencyMatrix, nodes)}
            disabled={!isValidMatrix}
          >
            Сохранить
          </button>
        </div>
        {/*<p className="text-xs text-primary text-center">{isValidMatrix ? "" : "Матрица смежности содержит некорректные данные или имеет некорректный формат"}</p>*/}
      </div>
    </div>
  );
};

export default AdjacencyMatrixEditor;
