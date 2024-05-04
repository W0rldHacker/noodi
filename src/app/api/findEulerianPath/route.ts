import cytoscape, { Core, EdgeCollection, EdgeSingular, ElementDefinition, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function findEulerianCycle(cy: Core) {
    let found = false;
    let cycle: string[] = [];
    let frames: any[] = [];
    let stepByStepExplanation: string[] = [];

    // Проверяем, все ли вершины имеют четную степень
    const nodes = cy.nodes();
    if (nodes.some(node => (node as NodeSingular).degree(false) % 2 !== 0)) {
      stepByStepExplanation.push("Граф не содержит Эйлеров цикл, так как не все вершины имеют четную степень");
      const resultText = "### Результат выполнения алгоритма нахождения Эйлерова цикла\n\n**Эйлеров цикл**: не найден";
      return { found, cycle, stepByStepExplanation, resultText };
    }

    // Алгоритм нахождения Эйлерова цикла
    let stack = [];
    let usedEdges = new Set();
    let currentNode = cy.nodes()[0];

    while (currentNode || stack.length > 0) {
        let neighborhoodEdges = sortEdgesByConnection(
          currentNode.connectedEdges().filter((e) => !usedEdges.has(e.id()) && isValidEdge(currentNode, e)),
          Number(currentNode.id())
        );
      /*let neighborhoodEdges = currentNode.connectedEdges().filter(e => !usedEdges.has(e.id())).sort((a, b) => {
        const aIds = a.id().split('-').map(Number);
        const bIds = b.id().split('-').map(Number);
  
        if (aIds[0] !== bIds[0]) {
          return aIds[0] - bIds[0];
        }
  
        return aIds[1] - bIds[1];
      });*/

      //console.log(neighborhoodEdges.map(n => n.id()))

      if (neighborhoodEdges.nonempty()) {
        stack.push(currentNode);
        let edge = neighborhoodEdges.first() as EdgeSingular;
        usedEdges.add(edge.id());
        console.log(stack.map(n => n.id()))
        currentNode = edge.target().same(currentNode) ? edge.source() : edge.target();
      } else {
        cycle.push(currentNode.id());
        currentNode = stack.pop()!;
      }
    }

    cycle.reverse();

    function sortEdgesByConnection(
      edges: EdgeCollection,
      currentNodeId: Number
    ) {
      return edges.sort((a, b) => {
        let partsA = a.id().split("-").map(Number);
        let partsB = b.id().split("-").map(Number);

        if (partsA[0] !== currentNodeId && partsA[1] === currentNodeId) {
          partsA = [partsA[1], partsA[0]];
        }
        if (partsB[0] !== currentNodeId && partsB[1] === currentNodeId) {
          partsB = [partsB[1], partsB[0]];
        }

        if (partsA[0] !== partsB[0]) {
          return partsA[0] - partsB[0];
        }

        return partsA[1] - partsB[1];
      });
    }

    function isValidEdge(currentNode: NodeSingular, edge: EdgeSingular) {
      if (edge.hasClass("oriented")) {
        return edge.source().id() === currentNode.id(); // Для ориентированных рёбер проверяем направление
      }
      return true; // Для неориентированных рёбер любое направление подходит
    }

    stepByStepExplanation.push("Эйлеров цикл успешно найден");
    const resultText = `### Результат выполнения алгоритма нахождения Эйлерова цикла\n\n**Эйлеров цикл**: ${cycle.join(' -> ')}`;

    return { found, cycle, stepByStepExplanation, resultText };
  }

  const { found, cycle, stepByStepExplanation, resultText } = findEulerianCycle(cy);

  return NextResponse.json({
    //found,
    //cycle,
    stepByStepExplanation,
    resultText,
  });
}
