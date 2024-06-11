import cytoscape, { Core } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function topologicalSort(cy: Core) {
    let isCyclic = false;
    const visited = new Set();
    const visiting = new Set();
    const visitedEdges = new Set();
    const sortedOrder: string[] = [];
    const frames = [];
    const stepByStepExplanation: string[] = [];

    function dfsCheckCycle(nodeId: string) {
      if (visiting.has(nodeId)) {
        isCyclic = true;
        return;
      }
      if (visited.has(nodeId)) {
        return;
      }
      visiting.add(nodeId);
      cy.edges()
        .filter((edge) => edge.data("source") === nodeId)
        .forEach((edge) => {
          dfsCheckCycle(edge.data("target"));
        });
      visiting.delete(nodeId);
      visited.add(nodeId);
    }

    cy.nodes().forEach((node) => {
      if (!visited.has(node.id())) {
        dfsCheckCycle(node.id());
      }
    });

    if (isCyclic) {
      const shortResultText =
        "Граф содержит цикл, топологическая сортировка невозможна.";
      return {
        frames: [],
        shortResultText,
        resultText: shortResultText,
        stepByStepExplanation: [],
        isCyclic,
      };
    }

    visited.clear();
    visiting.clear();

    cy.nodes().forEach((node) => {
      if (!visited.has(node.id()) && !visiting.has(node.id())) {
        dfs(cy, node.id(), "");
      }
    });

    function dfs(cy: Core, nodeId: string, prevNodeId: string) {
      const nodeTitle = cy.getElementById(nodeId).data("title");
      const prevNodeTitle = cy.getElementById(prevNodeId).data("title");
      visiting.add(nodeId);

      frames.push({
        visitingNodes: Array.from(visiting),
        visitedNodes: Array.from(visited),
        visitedEdges: Array.from(visitedEdges),
        nodesLabels: cy
          .nodes()
          .reduce((acc: { [key: string]: string }, node) => {
            acc[node.id()] = "";
            return acc;
          }, {}),
      });
      if (prevNodeId) {
        stepByStepExplanation.push(
          `Переходим к вершине \"${nodeTitle}\" из \"${prevNodeTitle}\". Проверяем всех её исходящих соседей`
        );
      } else {
        stepByStepExplanation.push(
          `Переходим к вершине \"${nodeTitle}\". Проверяем всех её исходящих соседей`
        );
      }

      const sortedOutEdges = cy
        .edges()
        .filter((edge) => edge.data("source") === nodeId)
        .sort((a, b) => {
          const aIds = a.id().split("-").map(Number);
          const bIds = b.id().split("-").map(Number);

          if (aIds[0] !== bIds[0]) {
            return aIds[0] - bIds[0];
          }

          return aIds[1] - bIds[1];
        });
      sortedOutEdges.forEach((edge) => {
        const targetId = edge.data("target");
        if (!visited.has(targetId) && !visiting.has(targetId)) {
          visitedEdges.add(edge.id());
          dfs(cy, targetId, nodeId);
        }
      });

      visiting.delete(nodeId);
      visited.add(nodeId);

      cy.edges().forEach((edge) => {
        if (edge.data("target") === nodeId && visitedEdges.has(edge.id())) {
          visitedEdges.delete(edge.id());
        }
      });

      sortedOrder.unshift(nodeId);
      frames.push({
        visitingNodes: Array.from(visiting),
        visitedNodes: Array.from(visited),
        visitedEdges: Array.from(visitedEdges),
        nodesLabels: cy
          .nodes()
          .reduce((acc: { [key: string]: string }, node) => {
            acc[node.id()] = "";
            return acc;
          }, {}),
      });
      stepByStepExplanation.push(
        `Все соседи вершины \"${nodeTitle}\" обработаны. Добавляем вершину \"${nodeId}\" в начало стека топологической сортировки`
      );
    }

    const shortResultText = `Топологический порядок вершин: ${sortedOrder
      .map((nodeId) => {
        return `\"${cy.getElementById(nodeId).data("title")}\"`;
      })
      .join(", ")}`;

    frames.push({
      visitingNodes: Array.from(visiting),
      visitedNodes: Array.from(visited),
      visitedEdges: Array.from(visitedEdges),
      nodesLabels: sortedOrder
        .slice()
        .reduce((acc: { [key: string]: string }, nodeId, index) => {
          acc[nodeId] = (index + 1).toString();
          return acc;
        }, {}),
    });
    stepByStepExplanation.push(shortResultText);

    const totalNodes = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;

    const resultText = `### Результат выполнения алгоритма топологической сортировки

**Топологический порядок вершин:** ${sortedOrder
      .map((nodeId) => {
        return `\"${cy.getElementById(nodeId).data("title")}\"`;
      })
      .join(", ")}

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

**Узнать больше об алгоритме топологической сортировки можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Топологическая_сортировка).**`;

    return {
      frames,
      shortResultText,
      resultText,
      stepByStepExplanation,
      isCyclic,
    };
  }

  const {
    frames,
    shortResultText,
    resultText,
    stepByStepExplanation,
    isCyclic,
  } = topologicalSort(cy);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
    isCyclic: isCyclic,
  });
}
