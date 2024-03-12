import cytoscape, { Core, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function tarjan(cy: Core) {
    let index = 0;
    let stack: any[] = [];
    let indices = new Map();
    let lowLink = new Map();
    let onStack = new Map();
    let sccs: any[][] = [];
    let sccsNodes: any[] = [];
    let visitedEdges = new Set<string>();
    let stepByStepExplanation: string[] = [];
    let frames: any[] = [];

    function getNodesLabels() {
      return Array.from(cy.nodes()).reduce((acc, n) => {
        const id = n.id();
        const index = indices.get(id) !== undefined ? indices.get(id) : "";
        const lowLinkValue = lowLink.get(id) !== undefined ? lowLink.get(id) : "";
        acc[id] = lowLinkValue !== "" ? `${index}, ${lowLinkValue}` : "";
        return acc;
      }, {} as {[key: string]: string});
    }

    function getSCCsEdges() {
      return sccs.flatMap((scc) => {
        const edgeIds = new Set();
        scc.forEach((v) => {
          scc.forEach((to) => {
            cy.edges().filter((e) =>
              (e.source().id() === v && e.target().id() === to) ||
              (e.source().id() === to && e.target().id() === v)
            ).forEach((e) => {
              edgeIds.add(e.id())
            });
          });
        });
        return Array.from(edgeIds);
      })
    }

    function filterVisitedEdges(scc: any[]) {
      const sccNodes = new Set(scc.map(n => n.id()));
      return new Set(Array.from(visitedEdges).filter(edgeId => {
        const edge = cy.edges().filter(e => e.id() === edgeId)[0];
        const sourceInSCC = sccNodes.has(edge.source().id());
        const targetInSCC = sccNodes.has(edge.target().id());
        return !(sourceInSCC && targetInSCC) && !(sourceInSCC !== targetInSCC);
      }));
    }

    function startTarjan(cy: Core) {
      cy.nodes().forEach((node) => {
        if (!indices.has(node.id())) {
          sccsNodes = sccs.flatMap((scc) => scc);
          frames.push({
            visitedNodes: Array.from(indices.keys()).filter((v) => !sccsNodes.includes(v)),
            visitedEdges: Array.from(visitedEdges),
            currentNode: node.id(),
            nodesLabels: getNodesLabels(),
            sccsNodes: sccsNodes,
            sccsEdges: getSCCsEdges(),
          });
          stepByStepExplanation.push(`Начинаем обход из вершины "${node.data("title")}"`);
          strongconnect(node);
        }
      });
    }

    function strongconnect(node: NodeSingular) {
      const nodeId = node.id();
      indices.set(nodeId, index);
      lowLink.set(nodeId, index);
      index++;
      stack.push(node);
      onStack.set(nodeId, true);

      sccsNodes = sccs.flatMap((scc) => scc);
      frames.push({
        visitedNodes: Array.from(indices.keys()).filter((v) => !sccsNodes.includes(v)),
        visitedEdges: Array.from(visitedEdges),
        currentNode: node.id(),
        nodesLabels: getNodesLabels(),
        sccsNodes: sccsNodes,
        sccsEdges: getSCCsEdges(),
      });
      stepByStepExplanation.push(`Обрабатываем вершину "${node.data("title")}, устанавливая индекс и lowLink в значение ${index - 1}". Значение метки: (${indices.get(nodeId)}, ${lowLink.get(nodeId)})`);

      let sortedNeighbors = node.outgoers("node").sort(
        (a, b) => Number(a.id()) - Number(b.id())
      );

      sortedNeighbors.forEach((neighbor) => {
        if (!indices.has(neighbor.id())) {
          cy.edges().filter(e => (e.source().id() === nodeId && e.target().id() === neighbor.id()) || (e.source().id() === neighbor.id() && e.target().id() === nodeId)).forEach(e => {
            visitedEdges.add(e.id());
          });
          strongconnect(neighbor);
          lowLink.set(
            nodeId,
            Math.min(lowLink.get(nodeId), lowLink.get(neighbor.id()))
          );
          sccsNodes = sccs.flatMap((scc) => scc);
          frames.push({
            visitedNodes: Array.from(indices.keys()).filter((v) => !sccsNodes.includes(v)),
            visitedEdges: Array.from(visitedEdges),
            currentNode: node.id(),
            nodesLabels: getNodesLabels(),
            sccsNodes: sccsNodes,
            sccsEdges: getSCCsEdges(),
          });
          stepByStepExplanation.push(`Обновляем значение lowLink для вершины "${node.data("title")}" после возвращения из "${neighbor.data("title")}". Новая метка: (${indices.get(nodeId)}, ${lowLink.get(nodeId)})"`)
        } else if (onStack.get(neighbor.id())) {
          cy.edges().filter(e => (e.source().id() === nodeId && e.target().id() === neighbor.id()) || (e.source().id() === neighbor.id() && e.target().id() === nodeId)).forEach(e => {
            visitedEdges.add(e.id());
          });
          lowLink.set(
            nodeId,
            Math.min(lowLink.get(nodeId), indices.get(neighbor.id()))
          );
          sccsNodes = sccs.flatMap((scc) => scc);
          frames.push({
            visitedNodes: Array.from(indices.keys()).filter((v) => !sccsNodes.includes(v)),
            visitedEdges: Array.from(visitedEdges),
            currentNode: node.id(),
            nodesLabels: getNodesLabels(),
            sccsNodes: sccsNodes,
            sccsEdges: getSCCsEdges(),
          });
          stepByStepExplanation.push(`Обновляем значение lowLink для вершины "${node.data("title")}". Новая метка: (${indices.get(nodeId)}, ${lowLink.get(nodeId)})`)
        }
      });

      if (lowLink.get(nodeId) === indices.get(nodeId)) {
        let scc = [];
        let w;
        do {
          w = stack.pop();
          onStack.set(w.id(), false);
          scc.push(w);
          const sccNodes = scc.map((n) => n.id());
          sccsNodes = sccs.flatMap((scc) => scc);
          frames.push({
            visitedNodes: Array.from(indices.keys()).filter((v) => !sccsNodes.includes(v) && !sccNodes.includes(v)),
            visitedEdges: Array.from(visitedEdges),
            currentNode: node.id(),
            nodesLabels: getNodesLabels(),
            sccsNodes: sccsNodes.concat(sccNodes),
            sccsEdges: getSCCsEdges(),
          });
          stepByStepExplanation.push(`Добавляем вершину "${w.data("title")}" в текущую компоненту сильной связности.`)
        } while (w !== node);
        sccs.push(scc.map((n) => n.id()));
        sccsNodes = sccs.flatMap((scc) => scc);
        const sccsEdges = getSCCsEdges();
        visitedEdges = filterVisitedEdges(scc);
        frames.push({
          visitedNodes: Array.from(indices.keys()).filter((v) => !sccsNodes.includes(v)),
          visitedEdges: Array.from(visitedEdges),
          currentNode: node.id(),
          nodesLabels: getNodesLabels(),
          sccsNodes: sccsNodes,
          sccsEdges: sccsEdges,
        });
        stepByStepExplanation.push(
          `Список вершин найденной компоненты сильной связности: ${scc.map(n => `"${n.data("title")}"`).join(', ')}`
        );
      }
    }

    startTarjan(cy);

    let sccsString = "";
    sccs.forEach((scc, index) => {
      sccsString += `  - Компонента ${index + 1}: ${scc.map(n => `"${cy.getElementById(n).data("title")}"`).join(", ")}\n`;
    });

    const totalNodes = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;

    const shortResultText = `Количество сильно связных компонент: ${sccs.length}`;

    const resultText = `### Результат выполнения алгоритма Тарьяна

**Количество сильно связных компонент**: ${sccs.length}

**Сильно связные компоненты:**
${sccsString}

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

**Узнать больше об алгоритме Крускала можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Тарьяна).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const { frames, shortResultText, resultText, stepByStepExplanation } =
    tarjan(cy);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
