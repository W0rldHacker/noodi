import cytoscape, { Core } from "cytoscape";
import { NextResponse } from "next/server";
import { PriorityQueue } from "@/utils/PriorityQueue";

export async function POST(req: Request) {
  const { graph, startNodeId, endNodeId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function dijkstra(cy: Core, startNodeId: string, endNodeId: string) {
    let distances: { [key: string]: number } = {};
    let prev: { [key: string]: string | null } = {};
    let visited = new Set();
    let pq = new PriorityQueue<string>();
    let frames: any[] = [];
    const startNodeTitle: string = cy.getElementById(startNodeId).data("title");
    const endNodeTitle: string = cy.getElementById(endNodeId).data("title");
    let stepByStepExplanation: string[] = [`Начинаем с вершины "${startNodeTitle}", устанавливаем расстояние до неё равным 0`];

    cy.nodes().forEach((node) => {
      let nodeId = node.id();
      distances[nodeId] = Infinity;
      prev[nodeId] = null;
      pq.enqueue(nodeId, Infinity);
    });

    distances[startNodeId] = 0;
    pq.enqueue(startNodeId, 0);

    while (!pq.isEmpty()) {
      let { element: nodeId, priority: distance } = pq.dequeue()!;
      if (visited.has(nodeId)) continue;
      let nodeTitle = cy.getElementById(nodeId).data("title");

      frames.push({
        fullyProcessedNodes: Array.from(visited),
        currentNode: nodeId,
        //nextNode: "",
        currentEdge: "",
        paths: Object.keys(distances).reduce(
          (acc: { [key: string]: string }, key) => {
            acc[key] =
              distances[key] === Infinity
                ? "∞"
                : distances[key].toString();
            return acc;
          },
          {}
        ),
        pathUpdateInfo: "",
        pathNodes: [],
        pathEdges: [],
      });
      if (nodeId !== startNodeId) {
        stepByStepExplanation.push(`Рассматриваем необработанную вершину "${nodeTitle}" с минимальным расстоянием ${distance === Infinity ? "∞" : distance}`);
      }

      cy.getElementById(nodeId)
        .connectedEdges()
        .forEach((edge) => {
          let isDirected = edge.hasClass("oriented");
          let sourceId = edge.source().id();
          let targetId = edge.target().id();
          let nextNodeId =
            sourceId === nodeId ? targetId : sourceId;  
          const nextNodeTitle = cy.getElementById(nextNodeId).data("title");
          let edgeTitle = edge.data("title");
          if (!edgeTitle && edge.id()) {
            edgeTitle = `${nodeId}-${nextNodeId}`;
          }

          if ((isDirected && sourceId === nodeId) || !isDirected) {
            let weight = edge.data("weight");
            let alt = distance + weight;

            let pathComparison = `${distances[nodeId] === Infinity ? "∞" : distances[nodeId]} + ${weight} ${
              alt < distances[nextNodeId] ? "<" : ">"
            } ${
              distances[nextNodeId] === Infinity ? "∞" : distances[nextNodeId]
            }`;

            frames.push({
              fullyProcessedNodes: Array.from(visited),
              currentNode: nodeId,
              //nextNode: nextNodeId,
              currentEdge: edge.id(),
              paths: Object.keys(distances).reduce(
                (acc: { [key: string]: string }, key) => {
                  acc[key] =
                    distances[key] === Infinity
                      ? "∞"
                      : distances[key].toString();
                  return acc;
                },
                {}
              ),
              pathUpdateInfo: pathComparison,
              pathNodes: [],
              pathEdges: [],
            });
            stepByStepExplanation.push(`Рассматриваем ребро "${edgeTitle}" ведущее к вершине "${nextNodeTitle}". Текущее расстояние: ${distances[targetId] === Infinity ? "∞" : distances[targetId]}, новое расстояние: ${alt === Infinity ? "∞" : alt} (${pathComparison})`);

            if (alt < distances[nextNodeId]) {
              frames.push({
                fullyProcessedNodes: Array.from(visited),
                currentNode: nodeId,
                //nextNode: nextNodeId,
                currentEdge: edge.id(),
                paths: Object.keys(distances).reduce(
                  (acc: { [key: string]: string }, key) => {
                    acc[key] =
                      distances[key] === Infinity
                        ? "∞"
                        : distances[key].toString();
                    return acc;
                  },
                  {}
                ),
                pathUpdateInfo: pathComparison,
                pathNodes: [],
                pathEdges: [],
              });
              distances[nextNodeId] = alt;
              prev[nextNodeId] = nodeId;
              pq.enqueue(nextNodeId, alt);
              stepByStepExplanation.push(`Так как ${pathComparison}, обновляем расстояние до вершины "${targetId}" до ${alt}.`)

              /*stepByStepExplanation.push(
                `Обновляем расстояние до вершины **${nextNodeId}** до **${alt}**.`
              );*/
            }
          }
        });
      visited.add(nodeId);
    }

    let edges: string[] = [];
    for (let at: string | null = endNodeId; at !== null; at = prev[at]) {
      if (prev[at] !== null) {
        let edge = cy.edges().filter(function (ele) {
          return (
            (ele.data("source") === prev[at!] && ele.data("target") === at) ||
            (ele.data("target") === prev[at!] && ele.data("source") === at)
          );
        });
        edges.push(edge.id());
      }
    }
    edges.reverse();

    let pathToEnd = reconstructPath(prev, endNodeId);
    let pathTitles = pathToEnd.map((nodeId) => `"${cy.getElementById(nodeId).data("title")}"`);
    let pathString = pathToEnd.includes(startNodeId) ? pathTitles.join(" 🠖 ") : "не существует";
    let allShortPaths = "";
    cy.nodes().forEach((node) => {
      let nodeId = node.id();
      let nodeTitle = node.data("title");
      if (distances[nodeId] !== Infinity) {
        let path = reconstructPath(prev, nodeId);
        let pathTitles = path.map((nodeId) => `"${cy.getElementById(nodeId).data("title")}"`);
        allShortPaths += `  - **Вершина "${nodeTitle}": Расстояние -** ${
          distances[nodeId]
        }, **Путь -** ${pathTitles.join(" 🠖 ")}\n`;
      } else {
        allShortPaths += `  - **Вершина "${nodeTitle}": Расстояние -** ∞, **Путь -** не существует\n`;
      }
    });

    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const visitedVerticesCount = pathToEnd.length;
    const visitedEdgesCount = edges.length;

    const shortResultText = `Кратчайший путь от вершины "${startNodeTitle}" до вершины "${endNodeTitle}": ${pathString}  
    Длина пути: ${distances[endNodeId] === Infinity ? "∞" : distances[endNodeId]}`;
    stepByStepExplanation.push(shortResultText);
    frames.push({
      fullyProcessedNodes: [],
      currentNode: "",
      //nextNode: "",
      currentEdge: "",
      paths: Object.keys(distances).reduce(
        (acc: { [key: string]: string }, key) => {
          acc[key] =
            distances[key] === Infinity ? "∞" : distances[key].toString();
          return acc;
        },
        {}
      ),
      pathUpdateInfo: "",
      pathNodes: pathToEnd,
      pathEdges: edges,
    });

    const resultText = `### Результат выполнения алгоритма Дейкстры

**Начальная вершина:** "${startNodeTitle}"  
**Конечная вершина:** "${endNodeTitle}"

**Кратчайший путь до конечной вершины:** ${pathString}  
**Длина кратчайшего пути:** ${distances[endNodeId] === Infinity ? "∞" : distances[endNodeId]}  

**Пошаговое описание алгоритма:**

${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Кратчайшие пути от начальной вершины до всех остальных:**
${allShortPaths}

**Статистика:**
- **Всего вершин в графе:** ${totalVertices}
- **Всего рёбер в графе:** ${totalEdges}
- **Количество вершин кратчайшего пути:** ${visitedVerticesCount}
- **Количество рёбер кратчайшего пути:** ${visitedEdgesCount}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше об алгоритме Дейкстры можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Дейкстры).**`;

    function reconstructPath(
      prev: { [key: string]: string | null },
      to: string | null
    ) {
      let path = [];
      for (let at = to; at !== null; at = prev[at]) {
        if (at !== null) {
          path.push(at);
        }
      }
      path.reverse();
      return path;
    }

    /*function findPathEdges(cy: Core, path: string[]) {
      let edges = [];
      for (let i = 0; i < path.length - 1; i++) {
        let edge = cy.edges().filter((edge) => {
          let source = edge.data("source");
          let target = edge.data("target");
          return (
            (source === path[i] && target === path[i + 1]) ||
            (source === path[i + 1] && target === path[i])
          );
        });
        if (edge.length > 0) {
          edges.push(edge.id());
        }
      }
      return edges;
    }*/

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    dijkstra(cy, startNodeId, endNodeId);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
