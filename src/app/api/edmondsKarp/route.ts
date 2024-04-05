import cytoscape, { Core, EdgeCollection, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, sourceId, sinkId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function preprocessGraph(cy: Core) {
    // Преобразование неориентированных рёбер в ориентированные
    cy.edges().forEach((edge) => {
      if (!edge.hasClass("oriented")) {
        // Если ребро неориентированное, добавляем обратное ребро
        const source = edge.data("source");
        const target = edge.data("target");
        const capacity = edge.data("weight");

        // Установка текущего ребра как ориентированного
        edge.data("directed", true);

        // Добавление обратного ребра с той же пропускной способностью
        cy.add({
          group: "edges",
          data: {
            id: `${target}-${source}`,
            source: target,
            target: source,
            weight: capacity,
          },
        });
      }
    });
  }

  function bfs(cy: Core, sourceId: string, sinkId: string) {
    let parent: { [key: string]: string | null } = {};
    let visited = new Set();
    let queue = [];
    let sortedEdges = cy.edges().sort((a, b) => {
      const aIds = a.id().split('-').map(Number);
      const bIds = b.id().split('-').map(Number);

      if (aIds[0] !== bIds[0]) {
        return aIds[0] - bIds[0];
      }

      return aIds[1] - bIds[1];
    }) as EdgeCollection;
    queue.push(sourceId);
    visited.add(sourceId);
    parent[sourceId] = null;

    while (queue.length > 0) {
      let currentNodeId = queue.shift();

      if (currentNodeId === sinkId) {
        let path = [];
        while (currentNodeId !== sourceId) {
          path.unshift(currentNodeId);
          currentNodeId = parent[currentNodeId];
        }
        path.unshift(sourceId);
        return path;
      }

      /*cy.edges().forEach((edge) => {
        let edgeSource = edge.data("source");
        let edgeTarget = edge.data("target");
        let isOriented = edge.hasClass("oriented");
        let capacity = edge.data("weight");

        if (
          edgeSource === currentNodeId &&
          !visited.has(edgeTarget) &&
          capacity > 0
        ) {
          parent[edgeTarget] = currentNodeId!;
          visited.add(edgeTarget);
          queue.push(edgeTarget);
        }
        if (
          !isOriented &&
          edgeTarget === currentNodeId &&
          !visited.has(edgeSource) &&
          capacity > 0
        ) {
          parent[edgeSource] = currentNodeId;
          visited.add(edgeSource);
          queue.push(edgeSource);
        }
      });*/

      let neighbors = sortedEdges
        .filter(
          (edge) =>
            edge.data("source") === currentNodeId &&
            !visited.has(edge.data("target"))
        );
      for (let edge of neighbors) {
        let nextNodeId = edge.data("target");
        if (!visited.has(nextNodeId) && edge.data("weight") > 0) {
          queue.push(nextNodeId);
          visited.add(nextNodeId);
          parent[nextNodeId] = currentNodeId;
        }
      }
    }
    return null;
  }

  function edmondsKarp(cy: Core, sourceId: string, sinkId: string) {
    preprocessGraph(cy);
    let flow = 0;
    const stepByStepExplanation = [];
    stepByStepExplanation.push(`Ищем кратчайший (по количеству рёбер) увеличивающий путь из истока (вершина ${sourceId}) до стока (вершина ${sinkId}) с помощью поиска в ширину`);
    let path = bfs(cy, sourceId, sinkId);

    while (path) {
      stepByStepExplanation.push(`Найден увеличивающий путь: ${path.join(" -> ")}.`);

      // Находим минимальную пропускную способность в увеличивающем пути
      let minCapacity = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        let edge = cy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i] &&
              edge.data("target") === path![i + 1]
          )[0];
        minCapacity = Math.min(minCapacity, edge.data("weight"));
      }

      // Обновляем пропускные способности и обратные рёбра
      for (let i = 0; i < path.length - 1; i++) {
        let forwardEdge = cy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i] &&
              edge.data("target") === path![i + 1]
          )[0];
        forwardEdge.data("weight", forwardEdge.data("weight") - minCapacity);
        // Добавляем или обновляем обратное ребро
        let reverseEdge = cy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i + 1] &&
              edge.data("target") === path![i]
          )[0];
        if (reverseEdge) {
          reverseEdge.data("weight", reverseEdge.data("weight") + minCapacity);
        } else {
          cy.add({
            group: "edges",
            data: {
              id: `reverse-${path[i + 1]}-${path[i]}`,
              source: path[i + 1],
              target: path[i],
              capacity: minCapacity,
            },
          });
        }
      }

      flow += minCapacity;
      stepByStepExplanation.push(`Минимальная пропускная способность на пути: ${minCapacity}. Текущий максимальный поток: ${flow}.`);

      stepByStepExplanation.push(`Ищем кратчайший (по количеству рёбер) увеличивающий путь из истока (вершина ${sourceId}) до стока (вершина ${sinkId}) с помощью поиска в ширину`);
      path = bfs(cy, sourceId, sinkId); // Поиск нового увеличивающего пути
    }

    let resultText = "### Результат выполнения алгоритма Эдмондса-Карпа\n\n";
    resultText += `Максимальный поток: ${flow}\n\n`;
    resultText += "Пошаговые объяснения:\n";
    stepByStepExplanation.forEach((explanation, index) => {
      resultText += `${index + 1}: ${explanation}\n\n`;
    });

    return { resultText, stepByStepExplanation };
  }

  const { resultText, stepByStepExplanation } = edmondsKarp(
    cy,
    sourceId,
    sinkId
  );

  return NextResponse.json({
    //frames: frames,
    //shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
