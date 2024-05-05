import cytoscape, { Core, EdgeCollection, EdgeSingular, ElementDefinition, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, isOriented } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function isEulerian(cy: Core, isOriented: boolean) {
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

      for (let id in inDegrees) {
        if (inDegrees[id] !== outDegrees[id]) {
          return ({ isEulerianGraph: false, message: "Граф не содержит Эйлеров цикл, так как не у всех вершин входящая степень равна исходящей" });
        }
      }

      if (!isStronglyConnected(cy)) {
        return ({ isEulerianGraph: false, message: "Граф не содержит Эйлеров цикл, так как он не является сильно связанным" });
      }
    } else {
      if (
        nodes.some((node) => (node as NodeSingular).degree(false) % 2 !== 0)
      ) {
        return ({ isEulerianGraph: false, message: "Граф не содержит Эйлеров цикл, так как не все вершины имеют четную степень" });
      }
    }

    return ({ isEulerianGraph: true, message: "" });
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
              data: { source: edge.source().id(), target: edge.target().id() },
            },
            {
              data: { source: edge.target().id(), target: edge.source().id() },
            },
          ])
        );
      }
    });

    directedGraph.nodes().forEach((node) => {
      let reachable = directedGraph.bfs({ roots: node, directed: true }).found;
      if (reachable.length !== directedGraph.nodes().length) {
        return false;
      }
    });

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

  function findEulerianCycle(cy: Core) {
    let found = false;
    let cycle: string[] = [];
    let frames: any[] = [];
    let stepByStepExplanation: string[] = [];
    let stack = [];
    let usedEdges = new Set();
    //let cycleEdges = new Set();
    let currentNode = cy.nodes()[0];
    let currentCycle = "";
    let emptyNodesOrder: { [key: string]: null } = {};

    cy.nodes().forEach(node => {
      emptyNodesOrder[node.id()] = null;
    })

    // Проверяем, все ли вершины имеют четную степень
    //const nodes = cy.nodes();
    const { isEulerianGraph, message } = isEulerian(cy, isOriented);
    if (!isEulerianGraph) {
      stepByStepExplanation.push(message);
      const shortResultText = message;
      const resultText = "";
      return { frames, shortResultText, resultText, stepByStepExplanation };
    }
    
    /*if (nodes.some(node => (node as NodeSingular).degree(false) % 2 !== 0)) {
      stepByStepExplanation.push("Граф не содержит Эйлеров цикл, так как не все вершины имеют четную степень");
      const resultText = "### Результат выполнения алгоритма нахождения Эйлерова цикла\n\n**Эйлеров цикл**: не найден";
      return { found, cycle, stepByStepExplanation, resultText };
    }*/    

    while (currentNode || stack.length > 0) {
        let neighborhoodEdges = sortEdgesByConnection(
          currentNode.connectedEdges().filter((e) => !usedEdges.has(e.id()) && isValidEdge(currentNode, e)),
          Number(currentNode.id())
        );

        //let currentEdge = neighborhoodEdges.nonempty() ? neighborhoodEdges.first() : null;
      /*let neighborhoodEdges = currentNode.connectedEdges().filter(e => !usedEdges.has(e.id())).sort((a, b) => {
        const aIds = a.id().split('-').map(Number);
        const bIds = b.id().split('-').map(Number);
  
        if (aIds[0] !== bIds[0]) {
          return aIds[0] - bIds[0];
        }
  
        return aIds[1] - bIds[1];
      });*/

      //console.log(neighborhoodEdges.map(n => n.id()))
      
      /*if (currentNode && stack.length === 0) {
        stepByStepExplanation.push(`Начинаем поиск цикла с вершины "${currentNode.data("title")}"`);
        frames.push({
          currentNodeId: currentNode.id(),
          currentEdgeId: currentEdge ? currentEdge.id() : "",
          //processedNodes: Array.from(cycle),
          processedEdges: Array.from(usedEdges),
          //stackNodes: stack.map(node => node.id()),
          cycleNodes: Array.from(cycle),
          cycleEdges: Array.from(usedEdges),
          vertexOrder: getVertexOrder(cycle)
        });
      }*/

      let stepDescription = currentNode && stepByStepExplanation.length !== 0
          ? `Переходим к вершине "${currentNode.data("title")}" и ищем непомеченные смежные рёбра`
          : `Начинаем поиск эйлерова цикла с вершины "${currentNode.data("title")}" и ищем непомеченные смежные рёбра`;
      stepByStepExplanation.push(stepDescription);
      frames.push({
        currentNode: currentNode.id(),
        currentEdge: "",
        //processedNodes: Array.from(cycle),
        processedEdges: Array.from(usedEdges),
        //stackNodes: stack.map(node => node.id()),
        //cycleNodes: [],
        cycleEdges: [],
        vertexOrder: emptyNodesOrder
      });

      if (neighborhoodEdges.nonempty()) {
        stack.push(currentNode);
        currentCycle = cycle
          .map((node) => `"${cy.getElementById(node).data("title")}"`)
          .join(" 🠖 ");
        currentCycle = currentCycle ? currentCycle : "пуст";
        stepByStepExplanation.push(
          `Так как непомеченные смежные рёбра существуют, помещаем вершину \"${currentNode.data(
            "title"
          )}\" в стек. Текущий стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]. Текущий цикл: ${currentCycle}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: "",
          //processedNodes: Array.from(cycle),
          processedEdges: Array.from(usedEdges),
          //stackNodes: [],
          //cycleNodes: [],
          cycleEdges: [],
          nodesOrder: emptyNodesOrder
        });

        let edge = neighborhoodEdges.first() as EdgeSingular;
        const nextNode = edge.target().same(currentNode) ? edge.source() : edge.target();
        let edgeTitle = edge.data("title");
        if (!edgeTitle) {
          edgeTitle = `${currentNode.data("title")}-${nextNode.data("title")}`;
        }
        stepByStepExplanation.push(
          `Обрабатываем рёбро \"${edgeTitle}\", ведущее к вершине \"${nextNode.data(
            "title"
          )}\" и помечаем его как использованное. Текущий стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]. Текущий цикл: ${currentCycle}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: edge.id(),
          //processedNodes: Array.from(cycle),
          processedEdges: Array.from(usedEdges),
          //stackNodes: [],
          //cycleNodes: [],
          cycleEdges: [],
          nodesOrder: emptyNodesOrder
        });

        usedEdges.add(edge.id());
        //cycleEdges.add(edge.id());
        //console.log(stack.map(n => n.id()))
        currentNode = nextNode;
        /*stepByStepExplanation.push(
          `Получаем с вершины стека вершину \"${currentNode.data(
            "title"
          )}\" и ищем непомеченные смежные рёбра\n  Стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]\n  Текущий цикл: ${currentCycle}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: "",
          //processedNodes: Array.from(cycle),
          processedEdges: Array.from(usedEdges),
          //stackNodes: [],
          cycleNodes: [],
          cycleEdges: [],
          nodesOrder: []
        });*/
      } else {
        cycle.push(currentNode.id());
        currentCycle = cycle
          .map((node) => `"${cy.getElementById(node).data("title")}"`)
          .join(" 🠖 ");
        currentCycle = currentCycle ? currentCycle : "пуст";
        const stackIsEmpty = stack.length === 0;
        const nextNode = stack.pop();
        //console.log(cycle.map(n => n))
        stepByStepExplanation.push(
          `Так как непомеченные смежные рёбра не найдены, добавляем вершину \"${currentNode.data(
            "title"
          )}\" в цикл${stackIsEmpty ? "" : " и извлекаем вершину стека"}. Текущий стек: [${stack
            .map((node) => `"${node.data("title")}"`)
            .join(", ")}]. Текущий цикл: ${currentCycle}`
        );
        frames.push({
          currentNode: currentNode.id(),
          currentEdge: "",
          //processedNodes: Array.from(cycle),
          processedEdges: Array.from(usedEdges),
          //stackNodes: [],
          //cycleNodes: [],
          cycleEdges: [],
          nodesOrder: emptyNodesOrder
        });
        currentNode = nextNode!;
      }
    }

    cycle.reverse();
    currentCycle = cycle
      .map((node) => `"${cy.getElementById(node).data("title")}"`)
      .join(" 🠖 ");
    currentCycle = currentCycle ? currentCycle : "пуст";
    stepByStepExplanation.push(
      `Так как стек пуст и все вершины полностью обработаны, завершаем поиск и разворачиваем последовательность вершин в цикле, переписав элементы в обратном порядке. Текущий цикл: ${currentCycle}`
    );
    frames.push({
      currentNode: "",
      currentEdge: "",
      //processedNodes: Array.from(cycle),
      processedEdges: Array.from(usedEdges),
      //stackNodes: [],
      //cycleNodes: [],
      cycleEdges: [],
      nodesOrder: emptyNodesOrder
    });

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
        return edge.source().id() === currentNode.id();
      }
      return true;
    }

    stepByStepExplanation.push(`Эйлеров цикл: ${cycle.join(' 🠖 ')}`);
    frames.push({
      currentNode: "",
      currentEdge: "",
      //processedNodes: Array.from(cycle),
      processedEdges: [],
      //stackNodes: [],
      //cycleNodes: Array.from(new Set(cycle)),
      cycleEdges: Array.from(usedEdges),
      vertexOrder: getVertexOrder(cycle)
    });
    
    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const shortResultText = `Эйлеров цикл: ${cycle.join(' 🠖 ')}`;

    const resultText = `### Результат выполнения алгоритма нахождения эйлерова цикла  

**Эйлеров цикл:** ${cycle.join(' 🠖 ')}  

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

**Узнать больше об алгоритме нахождения эйлерова цикла можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Эйлеров_цикл).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } = findEulerianCycle(cy);

  return NextResponse.json({
    frames,
    shortResultText,
    resultText,
    stepByStepExplanation,
  });
}
