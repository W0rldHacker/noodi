import cytoscape, { Core } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function formatInfinity(value: number) {
    return isFinite(value) ? value.toString() : "∞";
  }

  function floydWarshall(cy: Core) {
    const nodes = cy.nodes();
    const dist: { [key: string]: { [key: string]: number } } = {};

    nodes.forEach((node) => {
      dist[node.id()] = {};
      nodes.forEach((node2) => {
        dist[node.id()][node2.id()] = node === node2 ? 0 : Infinity;
      });
    });

    cy.edges().forEach((edge) => {
      const srcId = edge.source().id();
      const tgtId = edge.target().id();
      const weight = edge.data("weight");
      const isOriented = edge.hasClass("oriented");

      dist[srcId][tgtId] = Math.min(dist[srcId][tgtId], weight);

      if (!isOriented) {
        dist[tgtId][srcId] = Math.min(dist[tgtId][srcId], weight);
      }
    });

    nodes.forEach((k) => {
      const kid = k.id();
      nodes.forEach((i) => {
        const iid = i.id();
        nodes.forEach((j) => {
          const jid = j.id();
          if (dist[iid][jid] > dist[iid][kid] + dist[kid][jid]) {
            dist[iid][jid] = dist[iid][kid] + dist[kid][jid];
          }
        });
      });
    });

    return dist;
  }

  function findGraphProperties(dist: {
    [key: string]: { [key: string]: number };
  }) {
    let radius = Infinity;
    let diameter = 0;
    let center: string[] = [];
    const eccentricities: { [key: string]: number | null } = {};
    const frames = [];
    const stepByStepExplanation: string[] = [];

    cy.nodes().forEach((node) => {
      eccentricities[node.id()] = null;
    });

    for (let node in dist) {
      stepByStepExplanation.push(
        `Вычисляем эксцентриситет вершины \"${cy
          .getElementById(node)
          .data("title")}\". Текущий радиус: ${formatInfinity(
          radius
        )}, Текущий диаметр: ${formatInfinity(diameter)}`
      );
      frames.push({
        currentNode: node,
        currentRadius: formatInfinity(radius),
        currentDiameter: formatInfinity(diameter),
        currentEccentricity: "",
        eccentricities: Object.fromEntries(
          Object.entries(eccentricities).map(([key, value]) => [
            key,
            value ? formatInfinity(value) : null,
          ])
        ),
        centerNodes: [],
      });

      const maxDist = Math.max(...Object.values(dist[node]));
      eccentricities[node] = maxDist;
      diameter = Math.max(diameter, maxDist);
      radius = Math.min(radius, maxDist);

      stepByStepExplanation.push(
        `Эксцентриситет вершины \"${cy
          .getElementById(node)
          .data(
            "title"
          )}\" равен максимальному из кратчайших расстояний от неё до всех остальных: ${formatInfinity(
          maxDist
        )}. Текущий радиус: ${formatInfinity(
          radius
        )}, Текущий диаметр: ${formatInfinity(diameter)}`
      );
      frames.push({
        currentNode: node,
        currentRadius: formatInfinity(radius),
        currentDiameter: formatInfinity(diameter),
        currentEccentricity: formatInfinity(maxDist),
        eccentricities: Object.fromEntries(
          Object.entries(eccentricities).map(([key, value]) => [
            key,
            value ? formatInfinity(value) : null,
          ])
        ),
        centerNodes: [],
      });
    }

    stepByStepExplanation.push(
      `Ищем вершины с минимальным эксцентриситетом, равным радиусу (${formatInfinity(
        radius
      )}) и помещаем эти вершины в центр графа`
    );
    frames.push({
      currentNode: "",
      currentRadius: formatInfinity(radius),
      currentDiameter: formatInfinity(diameter),
      currentEccentricity: "",
      eccentricities: Object.fromEntries(
        Object.entries(eccentricities).map(([key, value]) => [
          key,
          value ? formatInfinity(value) : null,
        ])
      ),
      centerNodes: [],
    });
    for (let node in eccentricities) {
      if (eccentricities[node] === radius) {
        center.push(node);
      }
    }

    const totalVertices = cy.nodes().length;
    const totalEdges = cy.edges().length;
    const steps = frames.length;
    const centerString = `${center
      .map((node) => `\"${cy.getElementById(node).data("title")}\"`)
      .join(", ")}`;

    const shortResultText = `Радиус: ${formatInfinity(
      radius
    )}, Диаметр: ${formatInfinity(diameter)}, Центр: ${centerString}`;

    stepByStepExplanation.push(shortResultText);
    frames.push({
      currentNode: "",
      currentRadius: formatInfinity(radius),
      currentDiameter: formatInfinity(diameter),
      currentEccentricity: "",
      eccentricities: Object.fromEntries(
        Object.entries(eccentricities).map(([key, value]) => [
          key,
          value ? formatInfinity(value) : null,
        ])
      ),
      centerNodes: center,
    });

    const resultText = `### Результат нахождения радиуса, диаметра и центра графа

**Радиус графа:** ${formatInfinity(radius)}  
**Диаметр графа:** ${formatInfinity(diameter)}  
**Центр графа:** ${centerString}  

**Эксцентриситеты вершин:**
${Object.entries(eccentricities)
  .map(([key, value]) => {
    return `  - **Вершина \"${cy.getElementById(key).data("title")}\":** ${
      value ? formatInfinity(value) : null
    }`;
  })
  .join("\n")}

**Пошаговое описание алгоритма:**

${stepByStepExplanation
  .map((step, index) => {
    return `${index + 1}. ${step}`;
  })
  .join("\n")}

**Статистика:**
- **Всего вершин в графе:** ${totalVertices}
- **Всего рёбер в графе:** ${totalEdges}
- **Количество шагов алгоритма:** ${steps}

**Узнать больше о нахождении радиуса, диаметра и центра графа можно по следующей [ссылке](https://ru.wikipedia.org/wiki/Глоссарий_теории_графов).**`;

    return { frames, shortResultText, resultText, stepByStepExplanation };
  }

  const dist = floydWarshall(cy);
  const { frames, shortResultText, resultText, stepByStepExplanation } =
    findGraphProperties(dist);

  return NextResponse.json({
    frames: frames,
    shortResultText: shortResultText,
    resultText: resultText,
    stepByStepExplanation: stepByStepExplanation,
  });
}
