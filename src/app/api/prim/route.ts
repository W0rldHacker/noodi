import cytoscape, { Core, EdgeSingular } from "cytoscape";
import { NextResponse } from "next/server";
import { PriorityQueue } from "@/utils/PriorityQueue";

export async function POST(req: Request) {
  const { graph, startNodeId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function prim(cy: Core, startNodeId: string) {
    let visited = new Set([startNodeId]);
    let edgesQueue = new PriorityQueue<string>();
    let mstEdges: EdgeSingular[] = [];
    let frames = [];
    let totalWeight = 0;
    let sortedEdges = cy.edges().sort((a, b) => {
      const aIds = a.id().split("-").map(Number);
      const bIds = b.id().split("-").map(Number);

      if (aIds[0] !== bIds[0]) {
        return aIds[0] - bIds[0];
      }

      return aIds[1] - bIds[1];
    });
    let startNodeTitle = cy.getElementById(startNodeId).data("title");
    let stepByStepExplanation = [
      `Начинаем строить минимальное остовное дерево с вершины "${startNodeTitle}"`,
    ];

    frames.push({
      //currentEdge: "",
      mstNodes: Array.from(visited),
      mstEdges: mstEdges.map((e) => e.id()),
    });

    sortedEdges.forEach((edge) => {
      if (
        edge.source().id() === startNodeId ||
        edge.target().id() === startNodeId
      ) {
        let edgeId = edge.id();
        let weight = edge.data("weight");
        edgesQueue.enqueue(edgeId, weight);
      }
    });

    while (!edgesQueue.isEmpty() && visited.size < cy.nodes().length) {
      let { element: edgeId, priority: weight } = edgesQueue.dequeue()!;
      let edge = cy.getElementById(edgeId);
      let sourceId = edge.source().id();
      let targetId = edge.target().id();

      if (!visited.has(sourceId) || !visited.has(targetId)) {
        mstEdges.push(edge);
        totalWeight += weight;
        let nextNodeId = visited.has(sourceId) ? targetId : sourceId;
        let nextNodeTitle = cy.getElementById(nextNodeId).data("title");
        let currentNodeId = nextNodeId === sourceId ? targetId : sourceId;
        let currentNodeTitle = cy.getElementById(currentNodeId).data("title");
        let edgeTitle = edge.data("title");
        if (!edgeTitle && edge.id()) {
          edgeTitle = `${currentNodeTitle}-${nextNodeTitle}`;
        }

        visited.add(nextNodeId);

        frames.push({
          //currentEdge: edge.id(),
          mstNodes: Array.from(visited),
          mstEdges: mstEdges.map((e) => e.id()),
        });
        stepByStepExplanation.push(
          `Выбираем из списка рёбер, инцидентных вершине "${currentNodeTitle}", ребро "${edgeTitle}" с минимальным весом ${weight} и добавляем его в минимальное остовное дерево вместе с вершиной "${nextNodeTitle}", к которой оно ведёт`
        );

        cy.edges().forEach((nextEdge) => {
          let nextSourceId = nextEdge.source().id();
          let nextTargetId = nextEdge.target().id();
          if (
            (nextSourceId === nextNodeId && !visited.has(nextTargetId)) ||
            (nextTargetId === nextNodeId && !visited.has(nextSourceId))
          ) {
            let nextEdgeId = nextEdge.id();
            let nextWeight = nextEdge.data("weight");
            edgesQueue.enqueue(nextEdgeId, nextWeight);
          }
        });
      }
    }

    let allMstEdges = "";
    mstEdges.forEach((edge, index) => {
      let edgeTitle = edge.data("title");
      if (!edgeTitle && edge.id()) {
        edgeTitle = `${edge.source().id()}-${edge.target().id()}`;
      }
      allMstEdges += `${index + 1}. Ребро "${edgeTitle}": Вес - ${edge.data(
        "weight"
      )}\n`;
    });

    const totalNodes = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const mstEdgesCount = mstEdges.length;

    const shortResultText = `Общий вес минимального остовного дерева: ${totalWeight}  
    Ориентация рёбер не учитывается, так как остовное дерево можно построить только на неориентированных графах`;

    const resultText = `### Результат выполнения алгоритма Прима

**Начальная вершина:** "${startNodeTitle}"

**Рёбра минимального остовного дерева и их веса:**
${allMstEdges}

**Общий вес минимального остовного дерева:** ${totalWeight}

**Пошаговое описание алгоритма:**

${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalNodes}
- **Всего рёбер в графе:** ${totalEdges}
- **Количество рёбер минимального остовного дерева:** ${mstEdgesCount}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше об алгоритме Прима можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Прима).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } = prim(
    cy,
    startNodeId
  );

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
