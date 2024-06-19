import cytoscape, { Core, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph, startNodeId } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function getNodesPointers(
    cy: Core,
    turtle: NodeSingular | null,
    hare: NodeSingular | null
  ) {
    let nodesPointers: { [key: string]: string | null } = {};
    cy.nodes().forEach((node) => {
      let state = null;
      if (node === turtle && node === hare) {
        state = "Черепаха и заяц";
      } else if (node === turtle) {
        state = "Черепаха";
      } else if (node === hare) {
        state = "Заяц";
      }
      nodesPointers[node.id()] = state;
    });
    return nodesPointers;
  }

  function findCycleFloydsAlgorithm(cy: Core, startNodeId: string) {
    let startNode = cy.getElementById(startNodeId) as NodeSingular;
    let stepByStepExplanation = [
      `Начинаем поиск цикла с начальной вершины "${startNode.data(
        "title"
      )}", установив на неё черепаху и зайца`,
    ];
    let frames: any[] = [];
    let turtle: NodeSingular | null = startNode;
    let hare: NodeSingular | null = startNode;

    frames.push({
      hareNode: "",
      turtleNode: "",
      bothNode: startNode.id(),
      cycleNodes: [],
      cycleEdges: [],
      nodesPointers: getNodesPointers(cy, turtle, hare),
    });

    turtle = getNextNode(startNode);
    hare = getNextNode(getNextNode(startNode));

    stepByStepExplanation.push(
      `Смещаем черепаху на одну вершину вперёд, а зайца - на две вершины. Текущая позиция черепахи: ${
        turtle ? `вершина "${turtle.data("title")}"` : "конец графа"
      }, позиция зайца: "${
        hare ? `вершина "${hare.data("title")}"` : "конец графа"
      }`
    );
    frames.push({
      hareNode: hare !== turtle ? (hare ? hare.id() : "") : "",
      turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
      bothNode: hare !== turtle ? "" : turtle!.id(),
      cycleNodes: [],
      cycleEdges: [],
      nodesPointers: getNodesPointers(cy, turtle, hare),
    });

    while (hare && hare !== turtle) {
      turtle = getNextNode(turtle);
      hare = getNextNode(getNextNode(hare));
      stepByStepExplanation.push(
        `Снова смещаем черепаху на одну вершину вперёд, а зайца - на две вершины. Текущая позиция черепахи: ${
          turtle ? `вершина "${turtle.data("title")}"` : "конец графа"
        }, позиция зайца: ${
          hare ? `вершина "${hare.data("title")}"` : "конец графа"
        }`
      );
      frames.push({
        hareNode: hare !== turtle ? (hare ? hare.id() : "") : "",
        turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
        bothNode: hare !== turtle ? "" : turtle!.id(),
        cycleNodes: [],
        cycleEdges: [],
        nodesPointers: getNodesPointers(cy, turtle, hare),
      });
    }

    if (!hare) {
      stepByStepExplanation.push(
        `Так как заяц достиг конца графа, так и не встретившись с черепахой, то цикл, достижимый из начальной вершины "${startNode.data(
          "title"
        )}", не существует`
      );
      frames.push({
        hareNode: "",
        turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
        bothNode: "",
        cycleNodes: [],
        cycleEdges: [],
        nodesPointers: getNodesPointers(cy, turtle, hare),
      });
      const shortResultText = `Цикл, достижимый из начальной вершины "${startNode.data(
        "title"
      )}", не найден`;
      const resultText = `### Результат выполнения алгоритма "черепахи и зайца" Флойда  

**Цикл, достижимый из вершины "${startNode.data("title")}":** не найден

**Пошаговое описание алгоритма:**
${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**  
- Общее количество вершин: ${cy.nodes().length}  
- Общее количество рёбер графа: ${cy.edges().length}  
- Количество шагов алгоритма: ${stepByStepExplanation.length}  

**Узнать больше об алгоритме нахождения циклов в графе можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Нахождение_цикла).**`;
      return {
        frames,
        shortResultText,
        resultText: resultText,
        stepByStepExplanation,
      };
    }

    stepByStepExplanation.push(
      `Так как заяц и черепаха встретились, то цикл, достижимый из начальной вершины "${startNode.data(
        "title"
      )}", существует`
    );
    frames.push({
      hareNode: hare !== turtle ? hare.id() : "",
      turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
      bothNode: hare !== turtle ? "" : turtle!.id(),
      cycleNodes: [],
      cycleEdges: [],
      nodesPointers: getNodesPointers(cy, turtle, hare),
    });

    turtle = startNode;
    stepByStepExplanation.push(
      `Переходим к поиску начала цикла, для чего вернём черепаху на начальную вершину "${startNode.data(
        "title"
      )}"`
    );
    frames.push({
      hareNode: hare !== turtle ? hare.id() : "",
      turtleNode: hare !== turtle ? turtle.id() : "",
      bothNode: hare !== turtle ? "" : turtle!.id(),
      cycleNodes: [],
      cycleEdges: [],
      nodesPointers: getNodesPointers(cy, turtle, hare),
    });

    while (turtle !== hare) {
      turtle = getNextNode(turtle);
      hare = getNextNode(hare);
      stepByStepExplanation.push(
        `Смещаем черепаху и зайца на одну вершину вперёд. Текущая позиция черепахи: ${
          turtle ? `вершина "${turtle.data("title")}"` : "конец графа"
        }, позиция зайца: ${
          hare ? `вершина "${hare.data("title")}"` : "конец графа"
        }`
      );
      frames.push({
        hareNode: hare !== turtle ? (hare ? hare.id() : "") : "",
        turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
        bothNode: hare !== turtle ? "" : turtle!.id(),
        cycleNodes: [],
        cycleEdges: [],
        nodesPointers: getNodesPointers(cy, turtle, hare),
      });
    }

    const cycleStartNode = turtle!.id();
    stepByStepExplanation.push(
      `Заяц и черепаха встретились в вершине "${cycleStartNode}", которая является началом цикла`
    );
    frames.push({
      hareNode: hare !== turtle ? (hare ? hare.id() : "") : "",
      turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
      bothNode: hare !== turtle ? "" : turtle!.id(),
      cycleNodes: [],
      cycleEdges: [],
      nodesPointers: getNodesPointers(cy, turtle, hare),
    });

    let cycleNodes: any[] = [];
    let cycleEdges: any[] = [];
    do {
      const prevNodeId =
        cycleNodes.length > 0 ? cycleNodes[cycleNodes.length - 1] : null;
      cycleNodes.push(turtle!.id());
      if (prevNodeId) {
        const edge = cy
          .edges()
          .filter(
            (edge) =>
              edge.source().id() === prevNodeId &&
              edge.target().id() === turtle!.id()
          )
          .first();
        cycleEdges.push(edge.id());
      }
      stepByStepExplanation.push(
        `Добавляем вершину "${turtle!.data(
          "title"
        )}" в цикл. Текущий цикл: ${cycleNodes
          .map((node) => `"${cy.getElementById(node).data("title")}"`)
          .join(" 🠖 ")}, длина цикла: ${cycleEdges.length}`
      );
      frames.push({
        hareNode: "",
        turtleNode: "",
        bothNode: "",
        cycleNodes: Array.from(new Set(cycleNodes)),
        cycleEdges: Array.from(cycleEdges),
        nodesPointers: getNodesPointers(cy, turtle, hare),
      });

      turtle = getNextNode(turtle);
      stepByStepExplanation.push(
        `Смещаем черепаху на одну вершину вперёд. Текущая позиция черепахи: ${
          turtle ? `вершина "${turtle.data("title")}"` : "конец графа"
        }, текущий цикл: ${cycleNodes
          .map((node) => `"${cy.getElementById(node).data("title")}"`)
          .join(" 🠖 ")}, длина цикла: ${cycleEdges.length}`
      );
      frames.push({
        hareNode: "",
        turtleNode: hare !== turtle ? (turtle ? turtle.id() : "") : "",
        bothNode: hare !== turtle ? "" : turtle!.id(),
        cycleNodes: Array.from(new Set(cycleNodes)),
        cycleEdges: Array.from(cycleEdges),
        nodesPointers: getNodesPointers(cy, turtle, hare),
      });
    } while (turtle !== hare);

    const edge = cy
      .edges()
      .filter(
        (edge) =>
          edge.source().id() === cycleNodes[cycleNodes.length - 1] &&
          edge.target().id() === cycleStartNode
      )
      .first();
    cycleNodes.push(cycleStartNode);
    cycleEdges.push(edge.id());

    stepByStepExplanation.push(
      `Цикл, достижимый из вершины "${startNode.data("title")}": ${cycleNodes
        .map((node) => `"${cy.getElementById(node).data("title")}"`)
        .join(" 🠖 ")}, длина цикла: ${cycleEdges.length}`
    );
    frames.push({
      hareNode: "",
      turtleNode: "",
      bothNode: "",
      cycleNodes: Array.from(new Set(cycleNodes)),
      cycleEdges: Array.from(cycleEdges),
      nodesPointers: getNodesPointers(cy, turtle, hare),
    });

    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const cycleLength = cycleEdges.length;
    const shortResultText = `Цикл, достижимый из вершины "${startNode.data(
      "title"
    )}": ${cycleNodes
      .map((node) => `"${cy.getElementById(node).data("title")}"`)
      .join(" 🠖 ")}, длина цикла: ${cycleLength}`;

    const resultText = `### Результат выполнения алгоритма "черепахи и зайца" Флойда  

**Цикл, достижимый из вершины "${startNode.data("title")}":** ${cycleNodes
      .map((node) => `"${cy.getElementById(node).data("title")}"`)
      .join(" 🠖 ")}  
**Начальная вершина цикла:** "${cy
      .getElementById(cycleStartNode)
      .data("title")}"  
**Длина цикла:** ${cycleLength}  

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

**Узнать больше об алгоритме нахождения циклов в графе можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Нахождение_цикла).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  function getNextNode(node: NodeSingular | null) {
    if (node) {
      let edges = node.outgoers().edges();
      if (edges.length > 0) {
        return edges[0].target();
      }
    }
    return null;
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    findCycleFloydsAlgorithm(cy, startNodeId);

  return NextResponse.json({
    frames,
    shortResultText,
    resultText,
    stepByStepExplanation,
  });
}
