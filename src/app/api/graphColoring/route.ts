import cytoscape, { Core, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function colorGraph(cy: Core) {
    const colorMap = new Map();
    const frames = [];
    const stepByStepExplanation: string[] = [];
    let uncoloredNodes = cy.nodes().toArray();
    /*let sortedNodes = cy.nodes().sort((a, b) => {
      return getUncoloredNeighborsCount(b) - getUncoloredNeighborsCount(a);
    });*/

    function getUncoloredNeighborsCount(node: NodeSingular) {
      return node
        .neighborhood("node")
        .filter((neighbor) => !colorMap.has(neighbor.id())).length;
    }

    while (uncoloredNodes.length > 0) {
      uncoloredNodes.sort((a, b) => {
        const aUncoloredNeighbors = getUncoloredNeighborsCount(a);
        const bUncoloredNeighbors = getUncoloredNeighborsCount(b);
        if (aUncoloredNeighbors === bUncoloredNeighbors) {
          return Number(a.id()) - Number(b.id());
        }
        return bUncoloredNeighbors - aUncoloredNeighbors;
      });
    
      let nodeToColor = uncoloredNodes[0];
      
      /*let nodeToColor = uncoloredNodes.reduce((maxNode, node) =>
        getUncoloredNeighborsCount(node) > getUncoloredNeighborsCount(maxNode)
          ? node
          : maxNode
      );*/

      const nodeId = nodeToColor.id();
      const nodeTitle = nodeToColor.data("title");
      const availableColors = new Set([1, 2, 3, 4, 5]);

      frames.push({
        currentNode: nodeId,
        nodesColors: cy
          .nodes()
          .reduce((acc: { [key: string]: string }, node) => {
            acc[node.id()] = colorMap.get(node.id()) || 0;
            return acc;
          }, {}),
      });
      stepByStepExplanation.push(
        `Выбираем вершину \"${nodeTitle}\", так как у неё наибольшее число нераскрашенных соседей`
      );

      nodeToColor.neighborhood("node").forEach((neighbor) => {
        const neighborColor = colorMap.get(neighbor.id());
        if (neighborColor) {
          availableColors.delete(neighborColor);
        }
      });

      const chosenColor = Math.min(...availableColors);
      colorMap.set(nodeId, chosenColor);

      frames.push({
        currentNode: "",
        nodesColors: cy
          .nodes()
          .reduce((acc: { [key: string]: string }, node) => {
            acc[node.id()] = colorMap.get(node.id()) || 0;
            return acc;
          }, {}),
      });
      stepByStepExplanation.push(
        `Окрашиваем вершину \"${nodeTitle}\" в первый неиспользованный для раскраски соседей цвет №${chosenColor}.`
      );

      uncoloredNodes = uncoloredNodes.filter((node) => node.id() !== nodeId);
    }

    /*sortedNodes.forEach((node) => {
      const nodeId = node.id();
      const availableColors = new Set([1, 2, 3, 4, 5]); // Предполагаемая палитра цветов

      // Удаление цветов, уже присвоенных смежным вершинам
      node.neighborhood("node").forEach((neighbor) => {
        const neighborColor = colorMap.get(neighbor.id());
        if (neighborColor) {
          availableColors.delete(neighborColor);
        }
      });

      // Выбор минимального доступного цвета
      const chosenColor = Math.min(...availableColors);
      colorMap.set(nodeId, chosenColor);

      stepByStepExplanation.push(
        `Вершина ${nodeId} окрашена в цвет ${chosenColor}. Соседи пересчитываются.`
      );
    });*/

    const uniqueColorsCount = new Set(colorMap.values()).size;
    const shortResultText = `Количество использованных для раскраски графа цветов: ${uniqueColorsCount}`;

    frames.push({
      currentNode: "",
      nodesColors: cy
        .nodes()
        .reduce((acc: { [key: string]: string }, node) => {
          acc[node.id()] = colorMap.get(node.id()) || 0;
          return acc;
        }, {}),
    });
    stepByStepExplanation.push(
      `Количество использованных для раскраски графа цветов: ${uniqueColorsCount}`
    );

    let colorDistribution = "";
    cy.nodes()
      .sort((a, b) => {
        return Number(a.id()) - Number(b.id());
      })
      .forEach((node) => {
        colorDistribution += `- **Вершина \"${node.data(
          "title"
        )}\":** Цвет - ${colorMap.get(node.id())}\n`;
      });

    const totalNodes = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;

    const resultText = `### Результат выполнения алгоритма цветовой раскраски вершин графа

**Использовано цветов:** ${uniqueColorsCount}

**Распределение цветов:**
${colorDistribution}

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

**Узнать больше об алгоритме цветовой раскраски графа можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Раскраска_графов).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    colorGraph(cy);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
