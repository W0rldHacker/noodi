import cytoscape, { Core, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, needCycle } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function findHamiltonianPath(
    cy: Core,
    startNodeId: string,
    needCycle: boolean
  ) {
    let path = [startNodeId];
    let visitedNodes = new Set([startNodeId]);
    let visitedEdges = new Set();
    let found = false;
    let cycle: string[] = [];
    let frames: any[] = [];
    let stepByStepExplanation: string[] = [];

    function backtrack(currentNodeId: string, prevNodeId: string) {
      const currentNodeTitle = cy.getElementById(currentNodeId).data("title");
      let stepDescription =
        currentNodeId !== startNodeId
          ? `Переходим от вершины \"${cy
              .getElementById(prevNodeId)
              .data("title")}\" к вершине \"${currentNodeTitle}\"`
          : `Начинаем обход с начальной вершины "${currentNodeTitle}"`;
      stepByStepExplanation.push(stepDescription);
      frames.push({
        visitedNodes: Array.from(visitedNodes),
        visitedEdges: Array.from(visitedEdges),
      });

      if (path.length === cy.nodes().length) {
        if (needCycle) {
          let lastNode = cy.getElementById(currentNodeId);
          let startNode = cy.getElementById(startNodeId);
          if (isEdgeValid(lastNode, startNode)) {
            visitedEdges.add(lastNode.edgesWith(startNode).first().id());
            found = true;
            cycle = [...path, startNodeId];
            stepByStepExplanation.push(
              `Гамильтонов цикл: ${cycle.join(" 🠖 ")}`
            );
            frames.push({
              visitedNodes: Array.from(visitedNodes),
              visitedEdges: Array.from(visitedEdges),
            });
            return true;
          }
          return false;
        } else {
          found = true;
          stepByStepExplanation.push(`Гамильтонов путь: ${path.join(" 🠖 ")}`);
          frames.push({
            visitedNodes: Array.from(visitedNodes),
            visitedEdges: Array.from(visitedEdges),
          });
          return true;
        }
      }

      let sortedNeighbors = cy
        .getElementById(currentNodeId)
        .neighborhood()
        .nodes()
        .sort((a, b) => Number(a.id()) - Number(b.id()));
      sortedNeighbors.forEach((neighbor) => {
        let neighborId = neighbor.id();
        let edge = cy.getElementById(currentNodeId).edgesWith(neighbor).first();
        if (
          !visitedNodes.has(neighborId) &&
          isEdgeValid(cy.getElementById(currentNodeId), neighbor)
        ) {
          path.push(neighborId);
          visitedNodes.add(neighborId);
          if (edge) {
            visitedEdges.add(edge.id());
          }
          if (backtrack(neighborId, currentNodeId)) {
            return true;
          }
          if (!found) {
            path.pop();
            visitedNodes.delete(neighborId);
            if (edge) visitedEdges.delete(edge.id());
            stepByStepExplanation.push(
              `Возвращаемся из вершины \"${cy
                .getElementById(neighborId)
                .data("title")}\" к вершине \"${currentNodeTitle}\"`
            );
            frames.push({
              visitedNodes: Array.from(visitedNodes),
              visitedEdges: Array.from(visitedEdges),
            });
          }
        }
      });
      return false;
    }

    function isEdgeValid(sourceNode: NodeSingular, targetNode: NodeSingular) {
      let edge = sourceNode.edgesWith(targetNode).first();
      if (!edge.id()) return false;
      if (edge.hasClass("oriented")) {
        return edge.source().id() === sourceNode.id();
      }
      return true;
    }

    backtrack(startNodeId, "");

    if (!found) {
      stepByStepExplanation.push(
        `Гамильтонов ${needCycle ? "цикл" : "путь"} не найден`
      );
      frames.push({
        visitedNodes: [],
        visitedEdges: [],
      });
    }

    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const shortResultText = `Гамильтонов ${
      needCycle
        ? `цикл${found ? `: ${cycle.join(" 🠖 ")}` : " не найден"}`
        : `путь${found ? `: ${path.join(" 🠖 ")}` : " не найден"}`
    }`;

    const resultText = `### Результат выполнения алгоритма нахождения гамильтонова ${
      needCycle ? "цикла" : "пути"
    }  

**Гамильтонов ${
      needCycle
        ? `цикл${found ? `:** ${cycle.join(" 🠖 ")}` : "** не найден"}`
        : `путь${found ? `:** ${path.join(" 🠖 ")}` : " не найден"}`
    }  

**Пошаговое описание алгоритма:**
${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**  
- Общее количество вершин: ${totalVertices}  
- Общее количество рёбер графа: ${totalEdges}  
- Количество шагов алгоритма: ${steps}  

**Узнать больше об алгоритме нахождения Гамильтонова ${
      needCycle ? "цикла" : "пути"
    } можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Гамильтонов_граф).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    findHamiltonianPath(cy, cy.nodes()[0].id(), needCycle);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
