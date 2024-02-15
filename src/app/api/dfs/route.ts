import cytoscape, { Core } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, startNodeId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function depthFirstSearch(cy: Core, startNodeId: string) {
    let visitedNodes = new Set();
    let visitedEdges = new Set();
    let visitedNodesTitles: string[] = [];
    let stack = [{ prevNodeId: "", nodeId: startNodeId, edgeId: "" }];
    let frames = [];
    let stepByStepExplanation: string[] = [];

    while (stack.length > 0) {
      const { prevNodeId, nodeId, edgeId } = stack.pop()!;
      let prevNodeTitle: string = cy.getElementById(prevNodeId).data("title");
      let nodeTitle: string = cy.getElementById(nodeId).data("title");
      let edgeTitle: string = cy.getElementById(edgeId).data("title");
      if (!edgeTitle && edgeId) {
        edgeTitle = `${prevNodeTitle}-${nodeTitle}`;
      }
      if (!visitedNodes.has(nodeId)) {
        visitedNodes.add(nodeId);
        visitedEdges.add(edgeId);
        visitedNodesTitles.push(`"${nodeTitle}"`);

        let stepDescription = edgeId
          ? `Переходим от вершины **"${prevNodeTitle}"** к вершине **"${nodeTitle}"** через ребро **"${edgeTitle}"**`
          : `Начинаем обход с начальной вершины **"${nodeTitle}"**`;
        stepByStepExplanation.push(stepDescription);

        frames.push({
          visitedNodes: Array.from(visitedNodes),
          visitedEdges: Array.from(visitedEdges),
        });

        let neighbors = cy.getElementById(nodeId!).neighborhood().nodes();
        let sortedNeighbors = neighbors.sort(
          (a, b) => Number(b.id()) - Number(a.id())
        );

        sortedNeighbors.forEach((neighbor) => {
          if (!visitedNodes.has(neighbor.id())) {
            let edge = cy.getElementById(nodeId!).edgesWith(neighbor).first();
            let isDirected = edge.hasClass("oriented");

            if (!isDirected || edge.source().id() === nodeId) {
              stack.push({
                prevNodeId: nodeId,
                nodeId: neighbor.id(),
                edgeId: edge.id(),
              });
            }
          }
        });
      }
    }

    const startNodeTitle: string = cy.getElementById(startNodeId).data("title");
    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const visitedVerticesCount = frames[frames.length - 1].visitedNodes.length;
    const visitedEdgesCount = frames[frames.length - 1].visitedEdges.length - 1;
    const visitedOrder = visitedNodesTitles.join(", ");

    const shortResultText = `Порядок обхода вершин: ${visitedOrder}`;

    const resultText = `### Результат выполнения алгоритма поиска в глубину (DFS)

**Начальная вершина:** "${startNodeTitle}"

**Порядок обхода вершин:** ${visitedOrder}

**Пошаговое описание алгоритма:**

${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalVertices}
- **Всего рёбер в графе:** ${totalEdges}
- **Посещено вершин:** ${visitedVerticesCount}
- **Задействовано рёбер:** ${visitedEdgesCount}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше об алгоритме поиска в ширину можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Поиск_в_глубину).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    depthFirstSearch(cy, startNodeId);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
