import cytoscape, { Core } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, startNodeId, endNodeId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function bellmanFord(cy: Core, startNodeId: string, endNodeId: string) {
    let distances: { [key: string]: number } = {};
    let prev: { [key: string]: string | null } = {};
    let frames: any[] = [];
    const startNodeTitle: string = cy.getElementById(startNodeId).data("title");
    const endNodeTitle: string = cy.getElementById(endNodeId).data("title");
    let stepByStepExplanation: string[] = [`Устанавливаем нулевое расстояние до начальной вершины "${startNodeTitle}", расстояние до всех остальных вершин - ∞`];
    let sortedEdges = cy.edges().sort((a, b) => {
      const aIds = a.id().split('-').map(Number);
      const bIds = b.id().split('-').map(Number);

      if (aIds[0] !== bIds[0]) {
        return aIds[0] - bIds[0];
      }

      return aIds[1] - bIds[1];
    });
    let edges = sortedEdges.map((edge) => ({
      edgeId: edge.id(),
      source: edge.data("source"),
      target: edge.data("target"),
      weight: edge.data("weight"),
      directed: edge.hasClass("oriented"),
    }));
    let nodes = cy.nodes().map((node) => node.id());

    nodes.forEach((nodeId) => {
      distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
      prev[nodeId] = null;
    });

    frames.push({
      currentEdge: "",
      nextNode: "",
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

    for (let i = 0; i < nodes.length - 1; i++) {
      let updated = false;
      //stepByStepExplanation.push(`Итерация ${i + 1}: рассматриваем все рёбра графа`)

      edges.forEach(({ edgeId, source, target, weight, directed }) => {
        if (directed) {
          let sourceTitle = cy.getElementById(source).data("title");
          let targetTitle = cy.getElementById(target).data("title");
          let edgeTitle = cy.getElementById(edgeId).data("title");
          if (!edgeTitle && edgeId) {
            edgeTitle = `${sourceTitle}-${targetTitle}`;
          }

          let alt = distances[source] + weight;
          let pathComparsion = `${distances[source] === Infinity ? "∞" : distances[source]} + ${weight} ${
            alt < distances[target] ? "<" : ">"
          } ${
            distances[target] === Infinity ? "∞" : distances[target]
          }`;

          frames.push({
            currentEdge: edgeId,
            nextNode: target,
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
          stepByStepExplanation.push(`Итерация ${i + 1}: Рассматриваем ребро "${edgeTitle}", соединяющее вершины "${sourceTitle}" и "${targetTitle}". Текущее расстояние до вершины "${targetTitle}": ${distances[target] === Infinity ? "∞" : distances[target]}, новое расстояние: ${alt === Infinity ? "∞" : alt} (${pathComparsion})`);

          if (alt < distances[target]) {
            distances[target] = alt;
            prev[target] = source;
            updated = true;
            
            frames.push({
              currentEdge: edgeId,
              nextNode: target,
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
              pathUpdateInfo: pathComparsion,
              pathNodes: [],
              pathEdges: [],
            });
            stepByStepExplanation.push(`Так как ${pathComparsion}, обновляем расстояние до вершины "${targetTitle}" до ${alt}.`)
          }
        } else {
          [source, target].forEach((start, index) => {
            let end = index === 0 ? target : source;
            let startTitle = cy.getElementById(start).data("title");
            let endTitle = cy.getElementById(end).data("title");
            let edgeTitle = cy.getElementById(edgeId).data("title");
            if (!edgeTitle && edgeId) {
              edgeTitle = `${startTitle}-${endTitle}`;
            }
            let alt = distances[start] + weight;
            let pathComparsion = `${distances[start] === Infinity ? "∞" : distances[start]} + ${weight} ${
              alt < distances[end] ? "<" : ">"
            } ${
              distances[end] === Infinity ? "∞" : distances[end]
            }`;

            frames.push({
              currentEdge: edgeId,
              nextNode: end,
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
            stepByStepExplanation.push(`Итерация ${i + 1}: Рассматриваем ребро "${edgeTitle}", соединяющее вершины "${startTitle}" и "${endTitle}". Текущее расстояние до вершины "${endTitle}": ${distances[end] === Infinity ? "∞" : distances[end]}, новое расстояние: ${alt === Infinity ? "∞" : alt} (${pathComparsion})`);

            if (alt < distances[end]) {
              distances[end] = alt;
              prev[end] = start;
              updated = true;

              frames.push({
                currentEdge: edgeId,
                nextNode: end,
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
                pathUpdateInfo: pathComparsion,
                pathNodes: [],
                pathEdges: [],
              });
              stepByStepExplanation.push(`Так как ${pathComparsion}, обновляем расстояние до вершины "${endTitle}" до ${alt}.`)
            }
          });
        }
      });

      if (!updated) break;
    }

    let hasNegativeCycle = edges.some(({ source, target, weight }) => {
      return distances[source] + weight < distances[target];
    });

    /*if (hasNegativeCycle) {
      stepByStepExplanation.push(`Обнаружен цикл отрицательного веса.`);
    } else {
      stepByStepExplanation.push(`Циклы отрицательного веса не обнаружены.`);
    }*/

    let resultText = "";
    let shortResultText = "";

    if (hasNegativeCycle) {
      shortResultText =
        "В графе обнаружен цикл отрицательного веса. Корректное нахождение кратчайших путей невозможно.";
    } else {
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
      let pathTitles = pathToEnd.map(
        (nodeId) => `"${cy.getElementById(nodeId).data("title")}"`
      );
      let pathString = pathToEnd.includes(startNodeId)
        ? pathTitles.join(" 🠖 ")
        : "не существует";
      let allShortPaths = "";
      let sortedNodes = cy.nodes().sort((a, b) =>
        Number(a.id()) - Number(b.id())
      );
      sortedNodes.forEach((node) => {
        let nodeId = node.id();
        let nodeTitle = node.data("title");
        if (distances[nodeId] !== Infinity) {
          let path = reconstructPath(prev, nodeId);
          let pathTitles = path.map(
            (nodeId) => `"${cy.getElementById(nodeId).data("title")}"`
          );
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

      shortResultText = `Кратчайший путь от вершины "${startNodeTitle}" до вершины "${endNodeTitle}": ${pathString}  
      Длина пути: ${
        distances[endNodeId] === Infinity ? "∞" : distances[endNodeId]
      }`;
      stepByStepExplanation.push(shortResultText);
      frames.push({
        currentEdge: "",
        nextNode: "",
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

      resultText = `### Результат выполнения алгоритма Беллмана-Форда

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

**Узнать больше об алгоритме Беллмана-Форда можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Беллмана_—_Форда).**`;
    }

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

    // Формирование resultText
    //let resultText = generateResultText(distances, prev, startNodeId, endNodeId, hasNegativeCycle, cy);

    return { frames, shortResultText, resultText, stepByStepExplanation, hasNegativeCycle }
  }

  const { frames, shortResultText, resultText, stepByStepExplanation, hasNegativeCycle } =
    bellmanFord(cy, startNodeId, endNodeId);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
    hasNegativeCycle: hasNegativeCycle,
  });
}
