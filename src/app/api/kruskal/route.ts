import cytoscape, { Core, EdgeSingular } from "cytoscape";
import { NextResponse } from "next/server";
import { DisjointSet } from "@/utils/DisjointSet";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function kruskal(cy: Core) {
    let nodes = cy.nodes().map((node) => node.id());
    let disjointSet = new DisjointSet();
    let mstEdges: EdgeSingular[] = [];
    let mstNodes = new Set<string>();
    let stepByStepExplanation: string[] = [];
    let frames: { currentEdge: string; mstNodes: string[]; mstEdges: string[] }[] = [];
    let totalWeight = 0;

    nodes.forEach((nodeId) => disjointSet.makeSet(nodeId));

    let sortedEdges = cy
      .edges()
      .sort((a, b) => a.data("weight") - b.data("weight"));

    frames.push({
      currentEdge: "",
      mstNodes: [],
      mstEdges: [],
    });
    stepByStepExplanation.push(
      `Перед началом алгоритма сортируем рёбра графа в порядке неубывания весов`
    );

    sortedEdges.forEach((edge) => {
      let source = edge.source().id();
      let target = edge.target().id();
      let edgeTitle = edge.data("title");
      if (!edgeTitle && edge.id()) {
        edgeTitle = `${edge.source().data("title")}-${edge
          .target()
          .data("title")}`;
      }
      let edgeWeight = edge.data("weight");

      frames.push({
        currentEdge: edge.id(),
        mstNodes: Array.from(mstNodes),
        mstEdges: mstEdges.map((e) => e.id()),
      });
      stepByStepExplanation.push(
        `Проверяем ребро "${edgeTitle}" с весом ${edgeWeight}`
      );

      if (disjointSet.find(source) !== disjointSet.find(target)) {
        disjointSet.union(source, target);
        mstEdges.push(edge);
        mstNodes.add(source);
        mstNodes.add(target);
        totalWeight += edge.data("weight");

        frames.push({
          currentEdge: "",
          mstNodes: Array.from(mstNodes),
          mstEdges: mstEdges.map((e) => e.id()),
        });
        stepByStepExplanation.push(
          `Добавляем в минимальное остовное дерево ребро "${edgeTitle}" с весом ${edgeWeight}`
        );
      } else {
        frames.push({
          currentEdge: "",
          mstNodes: Array.from(mstNodes),
          mstEdges: mstEdges.map((e) => e.id()),
        });
        stepByStepExplanation.push(
          `Пропускаем ребро "${edgeTitle}" с весом ${edgeWeight}, так как его добавление создало бы цикл`
        );
      }
    });

    let allMstEdges = "";
    mstEdges.forEach((edge, index) => {
      let edgeTitle = edge.data("title");
      if (!edgeTitle && edge.id()) {
        edgeTitle = `${edge.source().id()}-${edge.target().id()}`;
      }
      allMstEdges += `${index + 1}. Ребро "${edgeTitle}": Вес - ${edge.data(
        "weight"
      )}\n`;
    });

    const totalNodes = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const mstEdgesCount = mstEdges.length;

    const shortResultText = `Общий вес минимального остовного дерева: ${totalWeight}  
    Ориентация рёбер не учитывается, так как остовное дерево можно построить только на неориентированных графах`;

    const resultText = `### Результат выполнения алгоритма Крускала

**Рёбра минимального остовного дерева и их веса:**
${allMstEdges}

**Общий вес минимального остовного дерева:** ${totalWeight}

**Пошаговое описание алгоритма:**
${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalNodes}
- **Всего рёбер в графе:** ${totalEdges}
- **Количество рёбер минимального остовного дерева:** ${mstEdgesCount}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше об алгоритме Крускала можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Крускала).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    kruskal(cy);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
