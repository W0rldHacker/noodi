import cytoscape, { Core } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, isNotOriented } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function calculateDegrees(cy: Core) {
    const frames: any[] = [];
    const stepByStepExplanation: string[] = [];
    let sortedNodes = cy
      .nodes()
      .sort((a, b) => Number(a.id()) - Number(b.id()));
    let resultText = "";
    let shortResultText = "";
    const totalVertices = sortedNodes.length;
    const totalEdges = cy.edges().length;

    if (isNotOriented) {
      let degrees: { [key: string]: number } = {};
      let minDegree = Infinity;
      let maxDegree = 0;

      sortedNodes.forEach((node) => {
        degrees[node.id()] = 0;
      });

      sortedNodes.forEach((node) => {
        const nodeId = node.id();

        stepByStepExplanation.push(
          `Вычисляем степень вершины "${node.data("title")}"`
        );
        frames.push({
          currentNode: nodeId,
          currentEdge: "",
          degrees: JSON.parse(JSON.stringify(degrees)),
        });

        let sortedConnectedEdges = node.connectedEdges().sort((a, b) => {
          const aIds = a.id().split("-").map(Number);
          const bIds = b.id().split("-").map(Number);

          if (aIds[0] !== bIds[0]) {
            return aIds[0] - bIds[0];
          }

          return aIds[1] - bIds[1];
        });

        sortedConnectedEdges.forEach((edge) => {
          let edgeTitle = edge.data("title");
          if (!edgeTitle && edge.id()) {
            edgeTitle = `${edge.id()}`;
          }
          stepByStepExplanation.push(`Рассматриваем ребро "${edgeTitle}". `);

          if (edge.source().id() !== edge.target().id()) {
            degrees[nodeId] += 1;
            stepByStepExplanation[
              stepByStepExplanation.length - 1
            ] += `Т.к. ребро инцидентно вершине "${node.data(
              "title"
            )}", то увеличиваем степень вершины на 1. Новая степень: ${
              degrees[nodeId]
            }`;
          } else {
            degrees[nodeId] += 2;
            stepByStepExplanation[
              stepByStepExplanation.length - 1
            ] += `Т.к. ребро является петлёй, то увеличиваем степень вершины на 2. Новая степень: ${degrees[nodeId]}`;
          }

          maxDegree = Math.max(maxDegree, degrees[nodeId]);
          minDegree = Math.min(minDegree, degrees[nodeId]);

          frames.push({
            currentNode: nodeId,
            currentEdge: edge.id(),
            degrees: JSON.parse(JSON.stringify(degrees)),
          });
        });
      });

      function getNodesDegreesText(degrees: { [key: string]: number }) {
        let result = "";
        for (let nodeId in degrees) {
          const nodeTitle = cy.getElementById(nodeId).data("title");
          result += `- **Вершина \"${nodeTitle}\":** Степень: ${degrees[nodeId]}\n`;
        }
        return result;
      }

      const nodesDegreesText = getNodesDegreesText(degrees);
      const steps = frames.length;
      shortResultText = `Минимальная степень: ${minDegree}, Максимальная степень: ${maxDegree}`;
      resultText = `### Результат вычисления степеней вершин графа

**Степени вершин:**
${nodesDegreesText}

**Пошаговое описание алгоритма:**

**Статистика:**
- **Всего вершин в графе:** ${totalVertices}
- **Всего рёбер в графе:** ${totalEdges}
- **Минимальная степень:** ${minDegree}
- **Максимальная степень:** ${maxDegree}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше о вычислении степеней вершин можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Степень_вершины_(теория_графов)).**`;
    } else {
      let degrees: { [key: string]: { in: number; out: number } } = {};
      let minInDegree = Infinity;
      let maxInDegree = 0;
      let minOutDegree = Infinity;
      let maxOutDegree = 0;

      sortedNodes.forEach((node) => {
        degrees[node.id()] = { in: 0, out: 0 };
      });

      sortedNodes.forEach((node) => {
        const nodeId = node.id();

        let sortedConnectedEdges = node.connectedEdges().sort((a, b) => {
          const aIds = a.id().split("-").map(Number);
          const bIds = b.id().split("-").map(Number);

          if (aIds[0] !== bIds[0]) {
            return aIds[0] - bIds[0];
          }

          return aIds[1] - bIds[1];
        });

        stepByStepExplanation.push(
          `Вычисляем полустепени захода и исхода для вершины "${node.data(
            "title"
          )}"`
        );
        frames.push({
          currentNode: nodeId,
          currentEdge: "",
          degrees: JSON.parse(JSON.stringify(degrees)),
        });

        sortedConnectedEdges.forEach((edge) => {
          const sourceId = edge.source().id();
          const targetId = edge.target().id();
          const isOriented = edge.hasClass("oriented");
          let edgeTitle = edge.data("title");
          if (!edgeTitle && edge.id()) {
            edgeTitle = `${sourceId}-${targetId}`;
          }

          stepByStepExplanation.push(`Рассматриваем ребро "${edgeTitle}". `);

          if (sourceId === nodeId) {
            degrees[nodeId].out += 1;
          }

          if (targetId === nodeId) {
            degrees[nodeId].in += 1;
          }

          if (!isOriented) {
            if (targetId !== nodeId) {
              degrees[nodeId].in += 1;
            }
            if (sourceId !== nodeId) {
              degrees[nodeId].out += 1;
            }
          }

          if (isOriented) {
            if (sourceId === nodeId && targetId === nodeId) {
              stepByStepExplanation[
                stepByStepExplanation.length - 1
              ] += `Т.к. ребро является петлёй, то увеличиваем полустепени захода и исхода на 1. Исход: ${degrees[nodeId].out}, Заход: ${degrees[nodeId].in}`;
            } else if (sourceId === nodeId && targetId !== nodeId) {
              stepByStepExplanation[
                stepByStepExplanation.length - 1
              ] += `Т.к. ребро исходит из вершины "${node.data(
                "title"
              )}", то увеличиваем полустепень исхода на 1. Исход: ${
                degrees[nodeId].out
              }, Заход: ${degrees[nodeId].in}`;
            } else if (sourceId !== nodeId && targetId === nodeId) {
              stepByStepExplanation[
                stepByStepExplanation.length - 1
              ] += `Т.к. ребро заходит в вершину "${node.data(
                "title"
              )}", то увеличиваем полустепень захода на 1. Исход: ${
                degrees[nodeId].out
              }, Заход: ${degrees[nodeId].in}`;
            }
          } else {
            stepByStepExplanation[
              stepByStepExplanation.length - 1
            ] += `Т.к. ребро неориентированное, то увеличиваем полустепени захода и исхода на 1. Исход: ${degrees[nodeId].out}, Заход: ${degrees[nodeId].in}`;
          }

          maxInDegree = Math.max(maxInDegree, degrees[nodeId].in);
          minInDegree = Math.min(minInDegree, degrees[nodeId].in);
          maxOutDegree = Math.max(maxOutDegree, degrees[nodeId].out);
          minOutDegree = Math.min(minOutDegree, degrees[nodeId].out);

          frames.push({
            currentNode: nodeId,
            currentEdge: edge.id(),
            degrees: JSON.parse(JSON.stringify(degrees)),
          });
        });
      });

      function getNodesDegreesText(degrees: {
        [key: string]: { in: number; out: number };
      }) {
        let result = "";
        for (let nodeId in degrees) {
          const nodeTitle = cy.getElementById(nodeId).data("title");
          result += `- **Вершина "${nodeTitle}":** Полустепень захода: ${degrees[nodeId].in}, Полустепень исхода: ${degrees[nodeId].out}\n`;
        }
        return result;
      }

      const nodesDegreesText = getNodesDegreesText(degrees);
      const steps = frames.length;
      shortResultText = `Минимальная полустепень захода: ${minInDegree}, Максимальная полустепень захода: ${maxInDegree}\n
Минимальная полустепень исхода: ${minOutDegree}, Максимальная полустепень исхода: ${maxOutDegree}`;
      resultText = `### Результат вычисления степеней вершин графа

**Степени вершин:**
${nodesDegreesText}

**Пошаговое описание алгоритма:**

${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalVertices}
- **Всего рёбер в графе:** ${totalEdges}
- **Минимальная полустепень захода:** ${minInDegree}
- **Максимальная полустепень захода:** ${maxInDegree}
- **Минимальная полустепень исхода:** ${minOutDegree}
- **Максимальная полустепень исхода:** ${maxOutDegree}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше о вычислении степеней вершин можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Степень_вершины_(теория_графов)).**`;
    }

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    calculateDegrees(cy);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
