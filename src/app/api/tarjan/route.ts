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
    let stepByStepExplanation: string[] = [];

    function startTarjan(cy: Core) {
      cy.nodes().forEach((node) => {
        if (!indices.has(node.id())) {
          strongconnect(node);
        }
      });

      return sccs;
    }

    cy.edges().forEach(edge => {
        console.log(edge.id());
    })

    function strongconnect(node: NodeSingular) {
      const nodeId = node.id();
      indices.set(nodeId, index);
      lowLink.set(nodeId, index);
      index++;
      stack.push(node);
      onStack.set(nodeId, true);

      stepByStepExplanation.push(
        `Посещаем вершину ${nodeId}, устанавливаем индекс и lowLink в ${
          index - 1
        }.`
      );

      node.outgoers("node").forEach((neighbor) => {
        if (!indices.has(neighbor.id())) {
          strongconnect(neighbor);
          lowLink.set(
            nodeId,
            Math.min(lowLink.get(nodeId), lowLink.get(neighbor.id()))
          );
        } else if (onStack.get(neighbor.id())) {
          lowLink.set(
            nodeId,
            Math.min(lowLink.get(nodeId), indices.get(neighbor.id()))
          );
        }
      });

      if (lowLink.get(nodeId) === indices.get(nodeId)) {
        let scc = [];
        let w;
        do {
          w = stack.pop();
          onStack.set(w.id(), false);
          scc.push(w);
        } while (w !== node);
        sccs.push(scc.map((n) => n.id()));
        stepByStepExplanation.push(
          `Найдена ССК: [${scc.map((n) => n.id()).join(", ")}].`
        );
      }
    }

    //const tarjan = new TarjanSCC();
    const result = startTarjan(cy);

    let resultText = "### Результат выполнения алгоритма Тарьяна\n\n";
    resultText += "**Найденные сильно связанные компоненты:**\n";
    result.forEach((scc, index) => {
      resultText += `${index + 1}: [${scc.join(", ")}]\n`;
    });

    resultText += `\n**Количество шагов алгоритма:** ${stepByStepExplanation.length}\n\n`;
    resultText += stepByStepExplanation.join("\n");
    resultText +=
      "\n\n**Узнать больше об алгоритме Тарьяна можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Алгоритм_Тарьяна).**";

    return { resultText, stepByStepExplanation };
  }

  const { resultText, stepByStepExplanation } =
    tarjan(cy);

  return NextResponse.json({
    //frames: frames,
    //shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
