import cytoscape, {
  Core,
  EdgeCollection,
  EdgeSingular,
  ElementDefinition,
  NodeSingular,
} from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, isOriented, needCycle } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function isEulerian(
    cy: Core,
    isOriented: boolean,
    needCycle: boolean
  ): {
    isEulerianGraph: boolean;
    message: string;
    startNode: NodeSingular | null;
  } {
    const nodes = cy.nodes();
    if (isOriented) {
      const inDegrees: { [key: string]: number } = {};
      const outDegrees: { [key: string]: number } = {};

      nodes.forEach((node) => {
        inDegrees[node.id()] = 0;
        outDegrees[node.id()] = 0;
      });

      cy.edges().forEach((edge) => {
        const sourceId = edge.source().id();
        const targetId = edge.target().id();
        outDegrees[sourceId]++;
        inDegrees[targetId]++;

        if (!edge.hasClass("oriented")) {
          outDegrees[targetId]++;
          inDegrees[sourceId]++;
        }
      });

      if (needCycle) {
        if (!isStronglyConnected(cy)) {
          return {
            isEulerianGraph: false,
            message:
              "Граф не содержит Эйлеров цикл, так как он не является сильно связанным",
            startNode: null,
          };
        }

        for (let id in inDegrees) {
          if (inDegrees[id] !== outDegrees[id]) {
            return {
              isEulerianGraph: false,
              message:
                "Граф не содержит Эйлеров цикл, так как не у всех вершин входящая степень равна исходящей",
              startNode: null,
            };
          }
        }
      } else {
        let oddDegreeNodes = cy
          .nodes()
          .filter((node) => node.degree(false) % 2 !== 0);
        if (oddDegreeNodes.length === 0) {
          for (let id in inDegrees) {
            if (inDegrees[id] !== outDegrees[id]) {
              return {
                isEulerianGraph: false,
                message:
                  "Граф не содержит Эйлеров путь, так как при отсутствии вершин с нечётной степенью не у всех вершин входящая степень равна исходящей",
                startNode: null,
              };
            }
          }
        } else if (oddDegreeNodes.length === 2) {
          let startNode = null;
          let endNode = null;
          for (let id in inDegrees) {
            if (inDegrees[id] === outDegrees[id] + 1) {
              if (endNode) {
                return {
                  isEulerianGraph: false,
                  message:
                    "Граф не содержит Эйлеров путь, так как при наличии двух вершин с нечётной степенью полустепени захода и исхода соответствует равенству in = out + 1 более, чем у одной вершины",
                  startNode: null,
                };
              }
              endNode = id;
            } else if (inDegrees[id] + 1 === outDegrees[id]) {
              if (startNode) {
                return {
                  isEulerianGraph: false,
                  message:
                    "Граф не содержит Эйлеров путь, так как при наличии двух вершин с нечётной степенью полустепени захода и исхода соответствует равенству in = out - 1 более, чем у одной вершины",
                  startNode: null,
                };
              }
              startNode = id;
            }
          }

          if (startNode && endNode) {
            return {
              isEulerianGraph: true,
              message: "",
              startNode: cy.getElementById(startNode) as NodeSingular,
            };
          } else {
            return {
              isEulerianGraph: false,
              message:
                "Граф не содержит Эйлеров путь, так как при наличии двух вершин с нечётной степенью нет пары вершин p и q, полустепени захода и исхода которых соответствуют равенствам in(p) = out(p) - 1 и in(q) = out(q) + 1",
              startNode: null,
            };
          }
        }
      }
    } else {
      if (
        nodes.some((node) => (node as NodeSingular).degree(false) % 2 !== 0)
      ) {
        return {
          isEulerianGraph: false,
          message:
            "Граф не содержит Эйлеров цикл, так как не все вершины имеют четную степень",
          startNode: null,
        };
      }
    }

    return { isEulerianGraph: true, message: "", startNode: cy.nodes()[0] };
  }

  function findAllReachableNodes(cy: Core, startNodeId: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const currentNode = cy.getElementById(currentNodeId);

      const neighborEdges = currentNode.connectedEdges();

      for (let i = 0; i < neighborEdges.length; i++) {
        const edge = neighborEdges[i];
        let targetNode = null;

        if (edge.hasClass("oriented")) {
          if (edge.source().id() === currentNodeId) {
            targetNode = edge.target();
          }
        } else {
          targetNode =
            edge.source().id() === currentNodeId
              ? edge.target()
              : edge.source();
        }

        if (targetNode && !visited.has(targetNode.id())) {
          visited.add(targetNode.id());
          queue.push(targetNode.id());
        }
      }
    }

    return Array.from(visited);
  }

  function isStronglyConnected(cy: Core) {
    let directedGraph = cy.collection();

    directedGraph = directedGraph.union(cy.nodes());

    cy.edges().forEach((edge) => {
      if (edge.hasClass("oriented")) {
        directedGraph = directedGraph.union(edge);
      } else {
        directedGraph = directedGraph.union(
          cy.add([
            {
              data: {
                id: `${edge.source().id()}-${edge.target().id()}`,
                source: edge.source().id(),
                target: edge.target().id(),
              },
            },
            {
              data: {
                id: `${edge.target().id()}-${edge.source().id()}`,
                source: edge.target().id(),
                target: edge.source().id(),
              },
            },
          ])
        );
      }
    });

    const nodes = directedGraph.nodes();
    for (let i = 0; i < nodes.length; i++) {
      let reachable = findAllReachableNodes(cy, nodes[i].id());
      if (reachable.length !== nodes.length) {
        return false;
      }
    }

    return true;
  }

  function getVertexOrder(cycle: string[]) {
    let order: { [key: string]: string } = {};
    cycle.forEach((nodeId, index) => {
      if (order[nodeId]) {
        order[nodeId] += `, ${index + 1}`;
      } else {
        order[nodeId] = `${index + 1}`;
      }
    });
    return order;
  }

  function sortEdgesByConnection(edges: EdgeCollection, currentNodeId: Number) {
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
      return edge.source().id() === currentNode.id();
    }
    return true;
  }

  function findEulerianPath(cy: Core) {
    let path: string[] = [];
    let frames: any[] = [];
    let stepByStepExplanation: string[] = [];
    let stack: NodeSingular[] = [];
    let usedEdges = new Set();
    let currentPath = "";
    let emptyNodesOrder: { [key: string]: null } = {};

    cy.nodes().forEach((node) => {
      emptyNodesOrder[node.id()] = null;
    });

    const { isEulerianGraph, message, startNode } = isEulerian(
      cy,
      isOriented,
      needCycle
    );
    if (!isEulerianGraph) {
      stepByStepExplanation.push(message);
      const shortResultText = message;
      const resultText = "";
      return { frames, shortResultText, resultText, stepByStepExplanation };
    }

    let currentNode = startNode!;

    while (currentNode || stack.length > 0) {
      let neighborhoodEdges = sortEdgesByConnection(
        currentNode
          .connectedEdges()
          .filter((e) => !usedEdges.has(e.id()) && isValidEdge(currentNode, e)),
        Number(currentNode.id())
      );

      let stepDescription =
        currentNode && stepByStepExplanation.length !== 0
          ? `Переходим к вершине "${currentNode.data(
              "title"
            )}" и ищем непомеченные смежные рёбра`
          : `Начинаем поиск эйлерова ${
              needCycle ? "цикла" : "пути"
            } с вершины "${currentNode.data(
              "title"
            )}" и ищем непомеченные смежные рёбра`;
      stepByStepExplanation.push(stepDescription);
      frames.push({
        currentNode: currentNode.id(),
        currentEdge: "",
        processedEdges: Array.from(usedEdges),
        pathEdges: [],
        vertexOrder: emptyNodesOrder,
      });

      if (neighborhoodEdges.nonempty()) {
        stack.push(currentNode);
        currentPath = path
          .map((node) => `"${cy.getElementById(node).data("title")}"`)
          .join(" 🠖 ");
        currentPath = currentPath ? currentPath : "пуст";
        stepByStepExplanation.push(
          `Так как непомеченные смежные рёбра существуют, помещаем вершину \"${currentNode.data(
            "title"
          )}\" в стек. Текущий стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]. Текущий ${
            needCycle ? "цикл" : "путь"
          }: ${currentPath}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: "",
          processedEdges: Array.from(usedEdges),
          pathEdges: [],
          nodesOrder: emptyNodesOrder,
        });

        let edge = neighborhoodEdges.first() as EdgeSingular;
        const nextNode = edge.target().same(currentNode)
          ? edge.source()
          : edge.target();
        let edgeTitle = edge.data("title");
        if (!edgeTitle) {
          edgeTitle = `${currentNode.data("title")}-${nextNode.data("title")}`;
        }
        stepByStepExplanation.push(
          `Обрабатываем рёбро \"${edgeTitle}\", ведущее к вершине \"${nextNode.data(
            "title"
          )}\" и помечаем его как использованное. Текущий стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]. Текущий ${
            needCycle ? "цикл" : "путь"
          }: ${currentPath}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: edge.id(),
          processedEdges: Array.from(usedEdges),
          pathEdges: [],
          nodesOrder: emptyNodesOrder,
        });

        usedEdges.add(edge.id());
        currentNode = nextNode;
      } else {
        path.push(currentNode.id());
        currentPath = path
          .map((node) => `"${cy.getElementById(node).data("title")}"`)
          .join(" 🠖 ");
        currentPath = currentPath ? currentPath : "пуст";
        const stackIsEmpty = stack.length === 0;
        const nextNode = stack.pop();
        stepByStepExplanation.push(
          `Так как непомеченные смежные рёбра не найдены, добавляем вершину \"${currentNode.data(
            "title"
          )}\" в ${needCycle ? "цикл" : "путь"}${
            stackIsEmpty ? "" : " и извлекаем вершину стека"
          }. Текущий стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]. Текущий ${
            needCycle ? "цикл" : "путь"
          }: ${currentPath}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: "",
          processedEdges: Array.from(usedEdges),
          pathEdges: [],
          nodesOrder: emptyNodesOrder,
        });
        currentNode = nextNode!;
      }
    }

    path.reverse();
    currentPath = path
      .map((node) => `"${cy.getElementById(node).data("title")}"`)
      .join(" 🠖 ");
    currentPath = currentPath ? currentPath : "пуст";
    stepByStepExplanation.push(
      `Так как стек пуст и все вершины полностью обработаны, завершаем поиск и разворачиваем последовательность вершин в ${
        needCycle ? "цикле" : "пути"
      }, переписав элементы в обратном порядке. Текущий ${
        needCycle ? "цикл" : "путь"
      }: ${currentPath}`
    );
    frames.push({
      currentNode: "",
      currentEdge: "",
      processedEdges: Array.from(usedEdges),
      pathEdges: [],
      nodesOrder: emptyNodesOrder,
    });

    stepByStepExplanation.push(
      `Эйлеров ${needCycle ? "цикл" : "путь"}: ${path.join(" 🠖 ")}`
    );
    frames.push({
      currentNode: "",
      currentEdge: "",
      processedEdges: [],
      pathEdges: Array.from(usedEdges),
      vertexOrder: getVertexOrder(path),
    });

    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const shortResultText = `Эйлеров ${
      needCycle ? "цикл" : "путь"
    }: ${path.join(" 🠖 ")}`;

    const resultText = `### Результат выполнения алгоритма нахождения эйлерова ${
      needCycle ? "цикла" : "пути"
    }  

**Эйлеров ${needCycle ? "цикл" : "путь"}:** ${path.join(" 🠖 ")}  

**Пошаговое описание алгоритма:**
${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**  
- Общее количество вершин: ${totalVertices}  
- Общее количество рёбер графа: ${totalEdges}  
- Количество шагов алгоритма: ${steps}  

**Узнать больше об алгоритме нахождения эйлерова ${
      needCycle ? "цикла" : "пути"
    } можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Эйлеров_цикл).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    findEulerianPath(cy);

  return NextResponse.json({
    frames,
    shortResultText,
    resultText,
    stepByStepExplanation,
  });
}
