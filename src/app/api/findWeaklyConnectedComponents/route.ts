import cytoscape, { Core, EdgeSingular, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function findWeaklyConnectedComponents(cy: Core) {
    let visitedNodes = new Set();
    let visitedEdges = new Set();
    const components: string[][] = [];
    let stack: { currentNode: NodeSingular; edge: EdgeSingular | null }[] = [];
    let frames: any[] = [];
    let stepByStepExplanation: string[] = [];
    let componentId = 1;
    const vertexToComponent: { [key: string]: string | null } = {};

    cy.nodes().forEach((node) => {
      vertexToComponent[node.id()] = null;
    });

    cy.nodes().forEach((node) => {
      if (!visitedNodes.has(node.id())) {
        const component: string[] = [];
        stack.push({ currentNode: node, edge: null });

        while (stack.length > 0) {
          const { currentNode, edge } = stack.pop()!;
          let nodeTitle: string = currentNode.data("title");

          if (!visitedNodes.has(currentNode.id())) {
            component.push(currentNode.id());
            vertexToComponent[currentNode.id()] = componentId.toString();
            visitedNodes.add(currentNode.id());
            if (edge) {
              visitedEdges.add(edge.id());
            }
            let stepDescription = edge
              ? `Посещаем вершину \"${nodeTitle}\" и добавляем её в текущую компоненту связности`
              : `Начинаем компоненту связности №${componentId} с вершины \"${nodeTitle}\" и запускаем из неё поиск в глубину`;
            stepByStepExplanation.push(stepDescription);
            frames.push({
              visitedNodes: Array.from(visitedNodes),
              visitedEdges: Array.from(visitedEdges),
              components: { ...vertexToComponent },
            });

            let neighbors = currentNode.neighborhood().nodes();
            let sortedNeighbors = neighbors.sort(
              (a, b) => Number(b.id()) - Number(a.id())
            );

            sortedNeighbors.forEach((neighbor) => {
              if (!visitedNodes.has(neighbor.id())) {
                let edge = currentNode.edgesWith(neighbor).first();
                stack.push({ currentNode: neighbor, edge: edge });
              }
            });
          }
        }
        components.push(component);
        componentId++;

        component.forEach((node) => {
          cy.getElementById(node)
            .connectedEdges()
            .forEach((edge) => {
              if (!visitedEdges.has(edge.id())) {
                visitedEdges.add(edge.id());
              }
            });
        });

        stepByStepExplanation.push(
          `Компонента связности №${componentId - 1} завершена. Она включает вершины: ${component
            .map((node) => {
              return `\"${cy.getElementById(node).data("title")}\"`;
            })
            .join(", ")}`
        );
        frames.push({
          visitedNodes: Array.from(visitedNodes),
          visitedEdges: Array.from(visitedEdges),
          components: { ...vertexToComponent },
        });
      }
    });

    let wccsString = "";
    components.forEach((wcc, index) => {
      wccsString += `  - Компонента ${index + 1}: ${wcc.map(n => `"${cy.getElementById(n).data("title")}"`).join(", ")}\n`;
    });

    const totalNodes = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;

    const shortResultText = `Количество слабо связных компонент: ${components.length}`;

    const resultText = `### Результат нахождения компонент слабой связности графа  

**Количество слабо связных компонент**: ${components.length}

**Слабо связные компоненты:**
${wccsString}

**Пошаговое описание алгоритма:**
${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalNodes}
- **Всего рёбер в графе:** ${totalEdges}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше об алгоритме нахождения компонент связности можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Компонента_связности_графа).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    findWeaklyConnectedComponents(cy);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
