import cytoscape, { Core, EdgeCollection, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, sourceId, sinkId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  const newCy = cytoscape({
    elements: graph.elements,
  });

  function preprocessGraph(cy: Core) {
    cy.edges().forEach((edge) => {
      if (!edge.hasClass("oriented")) {
        const source = edge.data("source");
        const target = edge.data("target");
        const capacity = edge.data("weight");

        edge.addClass("oriented");

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
      const aIds = a.id().split("-").map(Number);
      const bIds = b.id().split("-").map(Number);

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

      let neighbors = sortedEdges.filter(
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

  function edmondsKarp(
    cy: Core,
    newCy: Core,
    sourceId: string,
    sinkId: string
  ) {
    preprocessGraph(newCy);
    let flow = 0;
    const frames: any[] = [];
    const paths = [];
    let currentFlows: { [key: string]: number } = {};
    const flowPathsEdges: Set<string> = new Set();
    let flowPathsNodes: Set<string> = new Set();
    //let residualCapacities: { [key: string]: number } = {};
    cy.edges().forEach((edge) => {
      currentFlows[edge.id()] = 0;
      //residualCapacities[edge.id()] = edge.data("weight");
    });
    const stepByStepExplanation = [];
    frames.push({
      visitedNodes: Array.from(flowPathsNodes),
      visitedEdges: Array.from(flowPathsEdges),
      currentPathNodes: [],
      currentPathEdges: [],
      flows: { ...currentFlows },
      //residualCapacities: { ...residualCapacities },
    });
    const sourceNodeTitle = cy.getElementById(sourceId).data("title");
    const sinkNodeTitle = cy.getElementById(sinkId).data("title");
    stepByStepExplanation.push(
      `Ищем кратчайший (по количеству рёбер) увеличивающий путь из истока (вершина \"${sourceNodeTitle}\") до стока (вершина \"${sinkNodeTitle}\") с помощью поиска в ширину`
    );
    let path = bfs(newCy, sourceId, sinkId);

    while (path) {
      stepByStepExplanation.push(
        `Найден увеличивающий путь: ${path
          .map((node) => {
            return `\"${newCy.getElementById(node).data("title")}\"`;
          })
          .join(" 🠖 ")}`
      );
      let pathEdges: string[] = [];
      let pathNodes: Set<string> = new Set();

      let minCapacity = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        pathNodes.add(path[i]);
        //let edge = cy.edges().filter(`[id="${path[i]}-${path[i+1]}"]`).first();
        let edge = newCy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i] &&
              edge.data("target") === path![i + 1]
          )[0];
        minCapacity = Math.min(minCapacity, edge.data("weight"));
        if (cy.edges().contains(edge)) {
          pathEdges.push(edge.id());
        } else {
          const reverseEdge = cy.getElementById(`${path![i + 1]}-${path![i]}`);
          pathEdges.push(reverseEdge.id());
        }
      }
      pathNodes.add(sinkId);

      stepByStepExplanation[
        stepByStepExplanation.length - 1
      ] += `. Минимальная пропускная способность на пути: ${minCapacity}`;
      frames.push({
        visitedNodes: Array.from(flowPathsNodes),
        visitedEdges: Array.from(flowPathsEdges),
        currentPathNodes: Array.from(pathNodes),
        currentPathEdges: pathEdges,
        flows: { ...currentFlows },
        //residualCapacities: { ...residualCapacities },
      });

      for (let i = 0; i < path.length - 1; i++) {
        let forwardEdge = newCy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i] &&
              edge.data("target") === path![i + 1]
          )[0];
        forwardEdge.data("weight", forwardEdge.data("weight") - minCapacity);

        const sourceTitle = cy.getElementById(path![i]).data("title");
        const targetTitle = cy.getElementById(path![i + 1]).data("title");
        const oldFlow = currentFlows[forwardEdge.id()];

        if (cy.edges().contains(forwardEdge)) {
          currentFlows[forwardEdge.id()] += minCapacity;
          //residualCapacities[forwardEdge.id()] -= minCapacity;
          stepByStepExplanation.push(
            `Обновляем поток между вершинами \"${sourceTitle}\" и \"${targetTitle}\". Новое значение потока: ${oldFlow} + ${minCapacity} = ${
              currentFlows[forwardEdge.id()]
            }`
          );
        } else {
          const reverseEdge = cy.getElementById(`${path![i + 1]}-${path![i]}`);
          currentFlows[reverseEdge.id()] += minCapacity;
          //residualCapacities[reverseEdge.id()] -= minCapacity;
          stepByStepExplanation.push(
            `Обновляем поток между вершинами \"${targetTitle}\" и \"${sourceTitle}\". Новое значение потока: ${oldFlow} + ${minCapacity} = ${
              currentFlows[forwardEdge.id()]
            }`
          );
        }

        frames.push({
          visitedNodes: Array.from(flowPathsNodes),
          visitedEdges: Array.from(flowPathsEdges),
          currentPathNodes: Array.from(pathNodes),
          currentPathEdges: pathEdges,
          flows: { ...currentFlows },
          //residualCapacities: { ...residualCapacities },
        });

        let reverseEdge = newCy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i + 1] &&
              edge.data("target") === path![i]
          )[0];
        if (reverseEdge) {
          reverseEdge.data("weight", reverseEdge.data("weight") + minCapacity);
        } else {
          newCy.add({
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
      stepByStepExplanation[
        stepByStepExplanation.length - 1
      ] += `. Текущий максимальный поток: ${flow}`;

      paths.push({
        nodes: path,
        flow: minCapacity,
      });

      pathNodes.forEach(node => {
        flowPathsNodes.add(node);
      })

      pathEdges.forEach(edge => {
        flowPathsEdges.add(edge);
      })

      /*for (let i = 0; i < path.length; i++) {
        flowPathsNodes.add(path[i]);
        let edge = cy
          .edges()
          .filter(
            (edge) =>
              edge.data("source") === path![i] &&
              edge.data("target") === path![i + 1]
          )[0];
        if (edge) {
          flowPathsEdges.push(edge.id());
        } else {
          const reverseEdge = cy.getElementById(`${path![i + 1]}-${path![i]}`);
          flowPathsEdges.push(reverseEdge.id());
        }
      }*/

      frames.push({
        visitedNodes: Array.from(flowPathsNodes),
        visitedEdges: Array.from(flowPathsEdges),
        currentPathNodes: Array.from(pathNodes),
        currentPathEdges: pathEdges,
        flows: { ...currentFlows },
        //residualCapacities: { ...residualCapacities },
      });
      stepByStepExplanation.push(
        `Ищем новый кратчайший (по количеству рёбер) увеличивающий путь из истока (вершина \"${sourceNodeTitle}\") до стока (вершина \"${sinkNodeTitle}\") с помощью поиска в ширину`
      );
      path = bfs(newCy, sourceId, sinkId);
    }

    frames.push({
      visitedNodes: Array.from(flowPathsNodes),
      visitedEdges: Array.from(flowPathsEdges),
      currentPathNodes: [],
      currentPathEdges: [],
      flows: { ...currentFlows },
      //residualCapacities: { ...residualCapacities },
    });
    stepByStepExplanation.push(
      `Увеличивающий путь не найден, завершаем алгоритм`
    );

    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const totalPaths = paths.length;
    const steps = frames.length;

    const shortResultText = `Максимальный поток от вершины \"${sourceNodeTitle}\" до вершины \"${sinkNodeTitle}\": ${flow}`;

    const resultText = `### Результат выполнения алгоритма Эдмондса-Карпа

**Вершина-исток:** "${sourceNodeTitle}"  
**Вершина-сток:** "${sinkNodeTitle}"  
**Максимальный поток:** ${flow}  

**Пошаговое описание алгоритма:**

${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Пути потока:**
${paths
  .map((path, index) => {
    return `  - **Путь ${index + 1}:** ${path.nodes
      .map((node) => {
        return `\"${cy.getElementById(node).data("title")}\"`;
      })
      .join(" 🠖 ")}, **Поток:** ${path.flow}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalVertices}
- **Всего рёбер в графе:** ${totalEdges}
- **Количество путей потока:** ${totalPaths}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше об алгоритме Эдмондса-Карпа можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Эдмондса_—_Карпа).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    edmondsKarp(cy, newCy, sourceId, sinkId);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
