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

const createIncidenceMatrix = (cy: Core) => {
  const nodes = cy
    .nodes()
    .map((node) => node.id())
    .sort((a, b) => Number(a) - Number(b));
  const edges = cy.edges().map((edge) => ({
    id: edge.id(),
    weight: edge.data("weight"),
    source: edge.data("source"),
    target: edge.data("target"),
    oriented: edge.hasClass("oriented"),
  }));

  const matrix: number[][] = nodes.map(() => Array(edges.length).fill(0));

  /*let sortedEdges = edges.sort((a, b) => {
    const aIds = a.id.split("-").map(Number);
    const bIds = b.id.split("-").map(Number);

    if (aIds[0] !== bIds[0]) {
      return aIds[0] - bIds[0];
    }

    return aIds[1] - bIds[1];
  });*/

  //const edgeIds = sortedEdges.map((edge) => edge.id);

  edges.forEach((edge, index) => {
    const srcIndex = nodes.indexOf(edge.source);
    const tgtIndex = nodes.indexOf(edge.target);
    if (edge.oriented) {
      matrix[srcIndex][index] = edge.weight;
      matrix[tgtIndex][index] = -1 * edge.weight;
    } else {
      matrix[srcIndex][index] = edge.weight;
      matrix[tgtIndex][index] = edge.weight;
    }
  });

  return { matrix, nodes };
};

const IncidenceMatrixEditor: React.FC<AdjacencyMatrixEditorProps> = ({
  cy,
  close,
}) => {
  const { matrix, nodes } = createIncidenceMatrix(cy);
  const [isValidMatrix, setIsValidMatrix] = useState(true);
  const [matrixString, setMatrixString] = useState<string>(
    formatMatrix(matrix)
  );
  const [incidenceMatrix, setIncidenceMatrix] = useState<number[][]>(matrix);
  const { saveGraph, saveState } = useGraphEditor();

  const handleMatrixChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMatrixString(event.target.value);
    setIncidenceMatrix(parseMatrix(event.target.value));
  };

  const validateMatrix = (matrix: number[][]): boolean => {
    const columnCount = matrix[0].length;
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i].length !== columnCount) return false;
    }
    for (let j = 0; j < columnCount; j++) {
      let nonZeroValues: number[] = [];
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i][j] !== 0) {
          nonZeroValues.push(matrix[i][j]);
        }
        if (typeof matrix[i][j] !== "number" || isNaN(matrix[i][j]))
          return false;
      }
      if (
        nonZeroValues.length === 2 &&
        Math.abs(nonZeroValues[0]) !== Math.abs(nonZeroValues[1])
      )
        return false;
      if (nonZeroValues.length > 2) return false;
    }
    return true;
  };

  useEffect(() => {
    const isValid = validateMatrix(incidenceMatrix);
    setIsValidMatrix(isValid);
  }, [incidenceMatrix]);

  const isWeighted = (matrix: number[][]) => {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] !== 0 && matrix[i][j] !== 1 && matrix[i][j] !== -1) {
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
          cy.remove(existingEdge);
          edge.removeClass('oriented');
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
    nodeIds: string[],
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

    const updatedEdges = new Set<string>();

    incidenceMatrix[0].forEach((_, colIndex) => {
      const connections = incidenceMatrix.map((row, rowIndex) => ({
        weight: row[colIndex],
        nodeId: nodeIds[rowIndex],
      }));
      const positiveConnections = connections.filter((conn) => conn.weight > 0);
      const negativeConnections = connections.filter((conn) => conn.weight < 0);

      if (
        (positiveConnections.length === 2 &&
          positiveConnections[0].weight === positiveConnections[1].weight) ||
        (negativeConnections.length === 2 &&
          negativeConnections[0].weight === negativeConnections[1].weight)
      ) {
        const sourceId = positiveConnections.length === 2 ? positiveConnections[0].nodeId : negativeConnections[0].nodeId;
        const targetId = positiveConnections.length === 2 ? positiveConnections[1].nodeId : negativeConnections[1].nodeId;
        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;
        const weight = positiveConnections.length === 2 ? positiveConnections[0].weight : Math.abs(negativeConnections[0].weight);
        let edge = cy.getElementById(edgeId);
        let reverseEdge = cy.getElementById(reverseEdgeId);
        if (reverseEdge.length > 0) {
          reverseEdge.data("weight", weight);
          reverseEdge.data(
            "displayedWeight",
            isWeightedGraph ? weight.toString() : ""
          );
          if (reverseEdge.hasClass("oriented")) {
            reverseEdge.removeClass("oriented");
          }
          updatedEdges.add(reverseEdgeId);
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
          updatedEdges.add(edgeId);
        } else {
          edge.data("weight", weight);
          edge.data(
            "displayedWeight",
            isWeightedGraph ? weight.toString() : ""
          );
          if (edge.hasClass("oriented")) {
            edge.removeClass("oriented");
          }
          updatedEdges.add(edgeId);
        }
      } else if (
        negativeConnections.length === 1 &&
        positiveConnections.length === 1 &&
        positiveConnections[0].weight ===
          Math.abs(negativeConnections[0].weight)
      ) {
        const sourceId = positiveConnections[0].nodeId;
        const targetId = negativeConnections[0].nodeId;
        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;
        const edge = cy.getElementById(edgeId);
        const reverseEdge = cy.getElementById(reverseEdgeId);
        const weight = positiveConnections[0].weight;
        if (reverseEdge.length > 0 && !reverseEdge.hasClass("oriented")) {
          reverseEdge.remove();
        }
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
          cy.getElementById(edgeId).addClass("oriented");
          console.log("add", edge.id());
          updatedEdges.add(edgeId);
        } else {
          edge.data("weight", weight);
          edge.data(
            "displayedWeight",
            isWeightedGraph ? weight.toString() : ""
          );
          if (!edge.hasClass("oriented")) {
            edge.addClass("oriented");
          }
          console.log("update", edge.id());
          updatedEdges.add(edgeId);
        }
      } else if (
        (positiveConnections.length === 1 &&
          negativeConnections.length === 0) ||
        (positiveConnections.length === 0 && negativeConnections.length === 1)
      ) {
        const sourceId =
          positiveConnections.length === 1
            ? positiveConnections[0].nodeId
            : negativeConnections[0].nodeId;
        const targetId = sourceId;
        const edgeId = `${sourceId}-${targetId}`;
        const edge = cy.getElementById(edgeId);
        const weight =
          positiveConnections.length === 1
            ? positiveConnections[0].weight
            : Math.abs(negativeConnections[0].weight);
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
          updatedEdges.add(edgeId);
        } else {
          edge.data("weight", weight);
          edge.data(
            "displayedWeight",
            isWeightedGraph ? weight.toString() : ""
          );
          if (edge.hasClass("oriented")) {
            edge.removeClass("oriented");
          }
          updatedEdges.add(edgeId);
        }
      }
    });

    cy.edges().forEach((edge) => {
      const edgeId = edge.id();
      if (!updatedEdges.has(edgeId)) {
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
  };

  return (
    <div className="w-full px-8 py-2 flex flex-col gap-3 text-base">
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">Матрица инцидентности графа</p>
        <p className="text-base-content text-opacity-60 text-xs">
          Напишите матрицу инцидентности или измените уже существующую в поле ниже,
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
        <div className={`tooltip before:text-xs before:bg-base-300 after:text-base-300 ${isValidMatrix ? "before:hidden after:hidden" : ""}`} data-tip={isValidMatrix ? "" : "Матрица инцидентности содержит некорректные данные или имеет некорректный формат"}>
          <button
            className="btn btn-sm text-xs no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
            onClick={() => updateGraphFromMatrix(cy, incidenceMatrix, nodes)}
            disabled={!isValidMatrix}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidenceMatrixEditor;
