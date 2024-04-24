import cytoscape, { Core, NodeSingular } from "cytoscape";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { graph } = await req.json();

  const cy = cytoscape({
    elements: graph.elements,
  });

  function isHamiltonianPath(vertex: NodeSingular, path: NodeSingular[], visited: Set<string>): boolean {
    // If the path includes all vertices and returns to the start, it's a cycle
    if (path.length === cy.nodes().length) {
      // Check if it forms a cycle (Hamiltonian Cycle)
      if (vertex.edgesTo(path[0]).length > 0) { // Check if there is an edge back to the start
        path.push(path[0]); // Complete the cycle
        return true;
      }
      return false;
    }

    for (let neighbor of vertex.neighborhood('node')) {
      if (!visited.has(neighbor.id())) {
        visited.add(neighbor.id());
        path.push(neighbor);

        if (isHamiltonianPath(neighbor, path, visited)) {
          return true;
        }

        // Backtrack
        path.pop();
        visited.delete(neighbor.id());
      }
    }

    return false;
  }

  function findHamiltonianCycle() {
    const frames: any[] = [];
    const startVertex = cy.nodes()[0]; // Start from the first vertex
    const path = [startVertex];
    const visited = new Set([startVertex.id()]);

    if (!isHamiltonianPath(startVertex, path, visited) && path.length < cy.nodes().length + 1) {
      return { message: "No Hamiltonian cycle found.", frames };
    }

    // Record the result in frames for step-by-step explanation
    frames.push({
      path: path.map(node => node.id()),
      message: `Hamiltonian cycle found: ${path.map(node => node.id()).join(' -> ')}`
    });

    return { message: "Hamiltonian cycle found.", path, frames };
  }

  const { message, path, frames } = findHamiltonianCycle();

  let resultText = `### Результат выполнения алгоритма нахождения Гамильтонова цикла\n\n`;
  resultText += `**Результат:** ${message}\n`;
  if (path) {
    resultText += `**Путь:** ${path.map(node => node.id()).join(' -> ')}\n`;
  }
  resultText += "\n**Пошаговое объяснение:**\n";
  frames.forEach((frame, index) => {
    resultText += `${index + 1}: ${frame.message}\n`;
  });

  return NextResponse.json({
    resultText: resultText,
    //path: path ? path.map(node => node.id()) : [],
    frames: frames
  });
}
