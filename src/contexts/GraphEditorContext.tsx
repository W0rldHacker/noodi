"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Core, Stylesheet, ElementDefinition, NodeSingular, EdgeSingular, Position } from "cytoscape";

interface CyState {
  elements: ElementDefinition[];
  style?: Stylesheet;
  zoom?: number;
  pan?: Position;
}

interface State {
  visitedNodes: string[];
  visitedEdges: string[];
}

interface StateChanges {
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}

interface StringKeyValue {
  [key: string]: string;
}

/*interface CyState {
  graph: CyData;
  zoom: number;
  pan: Position;
}*/

interface GraphEditorContextProps {
  cyRef: React.MutableRefObject<Core | null>;
  getThemeStyles: (theme: string) => Stylesheet[];
  checked: boolean;
  setChecked: (value: boolean) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  tooltipContent: string;
  setTooltipContent: (content: string) => void;
  addNodeMode: boolean;
  toggleAddNodeMode: () => void;
  addEdgeMode: boolean;
  toggleAddEdgeMode: () => void;
  deleteMode: boolean;
  toggleDeleteMode: () => void;
  undoCount: number;
  redoCount: number;
  saveGraph: () => void;
  saveState: (graphState?: object) => void;
  undo: () => void;
  redo: () => void;
  clearGraph: () => void;
  sourceNode: string;
  setSourceNode: (content: string) => void;
  algorithmMode: boolean;
  selectedAlgorithm: React.MutableRefObject<string>;
  enableAlgorithmMode: (algorithmSlug: string) => void;
  disableAlgorithmMode: () => void;
  algorithmDetails: string;
  setAlgorithmDetails: (content: string) => void;
  isAnimationReady: boolean;
  isAnimationPlaying: React.MutableRefObject<boolean>;
  isPlaying: boolean;
  animationSpeed: React.MutableRefObject<number>;
  loopedMode: React.MutableRefObject<boolean>;
  isJustStartAlgorithm: boolean;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  startAlgorithm: () => void;
  toggleLoopedMode: () => void;
  increaseMultiplier: () => void;
  decreaseMultiplier: () => void;
  startAnimation: (frames: any) => void;
  playAnimation: () => void;
  pauseAnimation: () => void;
  stopAnimation: (needDisable: boolean) => void;
  stepForward: () => void;
  stepBack: () => void;
  setResultText: (content: string) => void;
  setStepByStepExplanation: (content: string[]) => void;
}

const GraphEditorContext = createContext<GraphEditorContextProps | undefined>(
  undefined
);

export const useGraphEditor = () => {
  const context = useContext(GraphEditorContext);
  if (!context) {
    throw new Error(
      "useGraphEditor должен использоваться внутри GraphEditorProvider"
    );
  }
  return context;
};

interface GraphEditorProviderProps {
  children: React.ReactNode;
}

export const GraphEditorProvider: React.FC<GraphEditorProviderProps> = ({
  children,
}) => {
  const speedMultipliers = [0.5, 1, 1.5, 2, 3];
  const [checked, setChecked] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [tooltipContent, setTooltipContent] = useState("");
  const [addNodeMode, setAddNodeMode] = useState(false);
  const [addEdgeMode, setAddEdgeMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [algorithmMode, setAlgorithmMode] = useState(false);
  //const [currentAlgorithm, setCurrentAlgorithm] = useState("");
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  //const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [algorithmDetails, setAlgorithmDetails] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  //const [isAnimationEnded, setIsAnimationEnded] = useState(false);
  const [stepByStepExplanation, setStepByStepExplanation] = useState<string[]>([]);
  const [resultText, setResultText] = useState("");
  const [manualSwitch, setManualSwitch] = useState(false);
  const [sourceNode, setSourceNode] = useState("");
  const [isJustStartAlgorithm, setIsJustStartAlgorithm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //const [animationFrames, setAnimationFrames] = useState<State[]>([]);
  const cyRef = useRef<Core | null>(null);
  const undoStack = useRef<CyState[]>([]);
  const redoStack = useRef<CyState[]>([]);
  const selectedAlgorithm = useRef("");
  const isAnimationPlaying = useRef(false);
  const isAnimationEnded = useRef(false);
  const animationFrame = useRef(0);
  const animationFrames = useRef<any[]>([]);
  const animationSpeed = useRef(speedMultipliers[1]);
  const loopedMode = useRef(false);
  const nodeLabels = useRef<{ [key: string]: HTMLElement }>({});
  const updateLabelPositionRefs = useRef<{ [key: string]: () => void }>({});
  const maxHistorySize = 20;
  const algorithmTooltips: StringKeyValue = {
    bfs: "Чтобы запустить алгоритм поиска в ширину, выберите начальную вершину, с которой будет начинаться поиск",
    dfs: "Чтобы запустить алгоритм поиска в глубину, выберите начальную вершину, с которой будет начинаться поиск",
    dijkstra: "Чтобы запустить алгоритм Дейкстры, выберите сначала начальную вершину, а затем конечную, до которой требуется найти кратчайший путь",
    bellmanFord: "Чтобы запустить алгоритм Беллмана-Форда, выберите сначала начальную вершину, а затем конечную, до которой требуется найти кратчайший путь",
    prim: "Нажмите \"Старт\" для запуска алгоритма Прима",
    kruskal: "Нажмите \"Старт\" для запуска алгоритма Крускала",
    tarjan: "Нажмите \"Старт\" для запуска алгоритма Тарьяна",
    topologicalSort: "Нажмите \"Старт\" для запуска алгоритма топологической сортировки",
    graphColoring: "Нажмите \"Старт\" для запуска алгоритма цветовой раскраски вершин графа",
    edmondsKarp: "Чтобы запустить алгоритм Эдмондса-Карпа, выберите сначала вершину-исток, а затем вершину-сток, до которой требуется найти максимальный поток",
    calculateDegrees: "Нажмите \"Старт\" для запуска алгоритма вычисления степеней вершин",
  }

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const toggleAddNodeMode = useCallback(() => {
    setAddNodeMode(!addNodeMode);
    setAddEdgeMode(false);
    setDeleteMode(false);
    setTooltipContent(
      !addNodeMode
        ? "Кликните по рабочей области там, где хотите разместить новую вершину"
        : ""
    );
  }, [addNodeMode, setTooltipContent]);

  const toggleAddEdgeMode = useCallback(() => {
    setAddEdgeMode(!addEdgeMode);
    setAddNodeMode(false);
    setDeleteMode(false);
    setTooltipContent(
      !addEdgeMode
        ? "Кликните сначала на начальной вершине, а затем на конечной, чтобы создать ребро между ними"
        : ""
    );
  }, [addEdgeMode, setTooltipContent]);

  const toggleDeleteMode = useCallback(() => {
    setDeleteMode(!deleteMode);
    setAddNodeMode(false);
    setAddEdgeMode(false);
    setTooltipContent(
      !deleteMode
        ? "Кликните на вершину или ребро, которое вы хотите удалить. Имейте в виду, что удаление вершины также удалит все связанные с ней рёбра"
        : ""
    );
  }, [deleteMode, setTooltipContent]);

  const enableAlgorithmMode = (algorithmSlug: string) => {
    setAlgorithmMode(true);
    setAddNodeMode(false);
    setAddEdgeMode(false);
    setDeleteMode(false);
    switch(algorithmSlug) {
      case "bfs": {
        removeLabels();
        break;
      }
      case "dfs": {
        removeLabels();
        break;
      }
      case "dijkstra": {
        createLabels();
        break;
      }
      case "bellmanFord": {
        createLabels();
        break;
      }
      case "prim": {
        removeLabels();
        break;
      }
      case "kruskal": {
        removeLabels();
        break;
      }
      case "tarjan": {
        createLabels();
        break;
      }
      case "topologicalSort": {
        createLabels();
        break;
      }
      case "graphColoring": {
        removeLabels();
        break;
      }
      case "edmondsKarp": {
        removeLabels();
        break;
      }
      case "calculateDegrees": {
        createLabels();
        break;
      }
    }

    if (selectedAlgorithm.current !== algorithmSlug) {
      if (selectedAlgorithm.current !== "") {
        stopAnimation(false);
      }
      selectedAlgorithm.current = algorithmSlug;
      setTooltipContent(algorithmTooltips[algorithmSlug]);
      if (
        selectedAlgorithm.current === "prim" ||
        selectedAlgorithm.current === "kruskal" ||
        selectedAlgorithm.current === "tarjan" ||
        selectedAlgorithm.current === "topologicalSort" ||
        selectedAlgorithm.current === "graphColoring" ||
        selectedAlgorithm.current === "calculateDegrees"
      ) {
        setIsJustStartAlgorithm(true);
      } else {
        setIsJustStartAlgorithm(false);
      }
      if (algorithmSlug === "edmondsKarp") {
        addEdgeFlowData();
      } else {
        removeEdgeFlowData();
      }
    }
  };

  const disableAlgorithmMode = () => {
    setAlgorithmMode(false);
    setTooltipContent("");
    setIsJustStartAlgorithm(false);
    stopAnimation(true);
    removeLabels();
    selectedAlgorithm.current = "";
  };

  const addEdgeFlowData = () => {
    cyRef.current!.edges().forEach(edge => {
      edge.data('flow', 0);
      edge.addClass('flow-display')
    });
  }

  const removeEdgeFlowData = () => {
    cyRef.current!.edges().forEach(edge => {
      edge.removeData('flow');
      edge.removeClass('flow-display')
    });
  }

  const createLabels = () => {
    cyRef.current!.nodes().forEach(node => {
      const nodeId = node.id();
      const existingLabelId = `label-for-${nodeId}`;

      function updateLabelPosition() {
        const label = nodeLabels.current[existingLabelId];
        const renderedPosition = node.renderedPosition();
        const containerOffset = document.getElementById('cy')!.getBoundingClientRect();
        const zoom = cyRef.current!.zoom();
        const offset = 28 * zoom;
        const baseFontSize = 12;
        label.style.left = `${renderedPosition.x + containerOffset.left}px`;
        label.style.top = `${renderedPosition.y + offset + containerOffset.top}px`;
        label.style.fontSize = `${baseFontSize * zoom}px`;
      }

      if (!nodeLabels.current[existingLabelId]) {
        //const description = node.data('title');
        const label = document.createElement('div');
        label.setAttribute('id', existingLabelId);
        label.classList.add('node-description');
        label.textContent = "";
        document.body.appendChild(label);
        nodeLabels.current[existingLabelId] = label;

        updateLabelPositionRefs.current[existingLabelId] = updateLabelPosition;
      
        updateLabelPosition();
      
        cyRef.current!.on("position", "node", updateLabelPosition);
        cyRef.current!.on('pan zoom resize', updateLabelPosition);
      }
    });
  }

  const removeLabels = () => {
    cyRef.current!.nodes().forEach(node => {
      const nodeId = node.id();
      const existingLabelId = `label-for-${nodeId}`;

      if (nodeLabels.current[existingLabelId]) {
        const label = document.getElementById(existingLabelId);
        if (label) {
          document.body.removeChild(label);
          delete nodeLabels.current[existingLabelId];
        }
      }

      const updateLabelPosition = updateLabelPositionRefs.current[existingLabelId];
      if (updateLabelPosition) {
        cyRef.current!.off("position", "node", updateLabelPosition);
        cyRef.current!.off('pan zoom resize', updateLabelPosition);
        delete updateLabelPositionRefs.current[existingLabelId];
      }
    });
  }

  const increaseMultiplier = () => {
    const currentIndex = speedMultipliers.indexOf(animationSpeed.current);
    const nextIndex = (currentIndex + 1) % speedMultipliers.length;
    animationSpeed.current = speedMultipliers[nextIndex];
  };

  const decreaseMultiplier = () => {
    const currentIndex = speedMultipliers.indexOf(animationSpeed.current);
    const prevIndex =
      (currentIndex - 1 + speedMultipliers.length) % speedMultipliers.length;
    animationSpeed.current = speedMultipliers[prevIndex];
  };

  const toggleLoopedMode = () => {
    loopedMode.current = !loopedMode.current;
  }

  const isGraphConnected = (cy: Core) => {
    if (cy.elements().nodes().length === 0) {
      return true;
    }
  
    let visited = new Set<cytoscape.NodeSingular>();
    let queue: cytoscape.NodeSingular[] = [];
    let nodes = cy.nodes();
  
    queue.push(nodes[0]);
  
    while (queue.length > 0) {
      let node = queue.shift()!;
      visited.add(node);
  
      node.neighborhood().nodes().forEach((node) => {
        if (!visited.has(node)) {
          visited.add(node);
          queue.push(node);
        }
      });
    }

    return visited.size === nodes.length;
  }

  const areAllEdgesOriented = (cy: Core) => {
    return cy.edges().every(edge => (edge as EdgeSingular).hasClass('oriented'));
  }

  const areAllEdgesNotOriented = (cy: Core) => {
    return cy.edges().every(edge => !(edge as EdgeSingular).hasClass('oriented'));
  }

  const startAlgorithm = () => {
    if (algorithmMode) {
      if (!isAnimationReady) {
        switch (selectedAlgorithm.current) {
          case "prim": {
            const isConnected = isGraphConnected(cyRef.current!);
            if (!isConnected) {
              setTooltipContent(
                "Граф не является связным, поэтому выполнить алгоритм Прима невозможно"
              );
            } else {
              const graph = cyRef.current!.json();
              setIsLoading(true);
              const startNode = cyRef.current!.nodes().min((node) => {
                return node.id();
              });
              const startNodeId = startNode.ele.id();
              axios
                .post("/api/prim", { graph: graph, startNodeId: startNodeId })
                .then((response) => {
                  const {
                    frames,
                    shortResultText,
                    resultText,
                    stepByStepExplanation,
                  } = response.data;
                  setTimeout(() => {
                    setIsLoading(false);
                    setIsJustStartAlgorithm(false);
                    setTooltipContent(shortResultText);
                    setResultText(shortResultText);
                    setAlgorithmDetails(resultText);
                    setStepByStepExplanation(stepByStepExplanation);
                    startAnimation(frames);
                  }, 1000);
                })
                .catch((error) => {
                  setIsLoading(false);
                  console.error("Ошибка запроса:", error);
                });
            }
            break;
          }
          case "kruskal": {
            const isConnected = isGraphConnected(cyRef.current!);
            if (!isConnected) {
              setTooltipContent(
                "Граф не является связным, поэтому выполнить алгоритм Крускала невозможно"
              );
            } else {
              const graph = cyRef.current!.json();
              setIsLoading(true);
              axios
                .post("/api/kruskal", { graph: graph })
                .then((response) => {
                  const {
                    frames,
                    shortResultText,
                    resultText,
                    stepByStepExplanation,
                  } = response.data;
                  setTimeout(() => {
                    setIsLoading(false);
                    setIsJustStartAlgorithm(false);
                    setTooltipContent(shortResultText);
                    setResultText(shortResultText);
                    setAlgorithmDetails(resultText);
                    setStepByStepExplanation(stepByStepExplanation);
                    startAnimation(frames);
                  }, 1000);
                })
                .catch((error) => {
                  setIsLoading(false);
                  console.error("Ошибка запроса:", error);
                });
            }
            break;
          }
          case "tarjan": {
            const isGraphFullyOriented = areAllEdgesOriented(cyRef.current!);
            if (!isGraphFullyOriented) {
              setTooltipContent(
                "Граф содержит неориентированные рёбра, поэтому корректное выполнение алгоритма Тарьяна невозможно"
              );
            } else {
              const graph = cyRef.current!.json();
              setIsLoading(true);
              axios
                .post("/api/tarjan", { graph: graph })
                .then((response) => {
                  const {
                    frames,
                    shortResultText,
                    resultText,
                    stepByStepExplanation,
                  } = response.data;
                  setTimeout(() => {
                    setIsLoading(false);
                    setIsJustStartAlgorithm(false);
                    setTooltipContent(shortResultText);
                    setResultText(shortResultText);
                    setAlgorithmDetails(resultText);
                    setStepByStepExplanation(stepByStepExplanation);
                    startAnimation(frames);
                  }, 1000);
                })
                .catch((error) => {
                  setIsLoading(false);
                  console.error("Ошибка запроса:", error);
                });
            }
            break;
          }
          case "topologicalSort": {
            const isGraphFullyOriented = areAllEdgesOriented(cyRef.current!);
            if (!isGraphFullyOriented) {
              setTooltipContent(
                "Граф содержит неориентированные рёбра, поэтому корректное выполнение алгоритма топологической сортировки невозможно"
              );
            } else {
              const graph = cyRef.current!.json();
              setIsLoading(true);
              axios
                .post("/api/topologicalSort", { graph: graph })
                .then((response) => {
                  const {
                    frames,
                    shortResultText,
                    resultText,
                    stepByStepExplanation,
                    isCyclic,
                  } = response.data;
                  setTimeout(() => {
                    setIsLoading(false);
                    setIsJustStartAlgorithm(false);
                    setTooltipContent(shortResultText);
                    if (!isCyclic) {
                      setResultText(shortResultText);
                      setAlgorithmDetails(resultText);
                      setStepByStepExplanation(stepByStepExplanation);
                      startAnimation(frames);
                    }
                  }, 1000);
                })
                .catch((error) => {
                  setIsLoading(false);
                  console.error("Ошибка запроса:", error);
                });
            }
            break;
          }
          case "graphColoring": {
            const graph = cyRef.current!.json();
            setIsLoading(true);
            axios
              .post("/api/graphColoring", { graph: graph })
              .then((response) => {
                const {
                  frames,
                  shortResultText,
                  resultText,
                  stepByStepExplanation,
                } = response.data;
                setTimeout(() => {
                  setIsLoading(false);
                  setIsJustStartAlgorithm(false);
                  setTooltipContent(shortResultText);
                  setResultText(shortResultText);
                  setAlgorithmDetails(resultText);
                  setStepByStepExplanation(stepByStepExplanation);
                  startAnimation(frames);
                }, 1000);
              })
              .catch((error) => {
                setIsLoading(false);
                console.error("Ошибка запроса:", error);
              });
            break;
          }
          case "calculateDegrees": {
            const graph = cyRef.current!.json();
            const isGraphNotOriented = areAllEdgesNotOriented(cyRef.current!);
            setIsLoading(true);
            axios
              .post("/api/calculateDegrees", { graph: graph, isNotOriented: isGraphNotOriented })
              .then((response) => {
                const {
                  frames,
                  shortResultText,
                  resultText,
                  stepByStepExplanation,
                } = response.data;
                setTimeout(() => {
                  setIsLoading(false);
                  setIsJustStartAlgorithm(false);
                  setTooltipContent(shortResultText);
                  setResultText(shortResultText);
                  setAlgorithmDetails(resultText);
                  setStepByStepExplanation(stepByStepExplanation);
                  startAnimation(frames);
                }, 1000);
              })
              .catch((error) => {
                setIsLoading(false);
                console.error("Ошибка запроса:", error);
              });
            break;
          }
        }
      }
    }
  }

  const startAnimation = (frames: any) => {
    setIsAnimationReady(true);
    animationFrames.current = frames;
    isAnimationPlaying.current = true;
    playAnimation();
  }

  const findStateChanges = (prevState: State, currentState: State, index: number) => {
    const addedNodes = currentState.visitedNodes.filter(
      (x) => !prevState.visitedNodes.includes(x)
    );
    const removedNodes = prevState.visitedNodes.filter(
      (x) => !currentState.visitedNodes.includes(x)
    );
    const addedEdges = currentState.visitedEdges.filter(
      (x) => !prevState.visitedEdges.includes(x)
    );
    const removedEdges = prevState.visitedEdges.filter(
      (x) => !currentState.visitedEdges.includes(x)
    );

    const stateChanges: StateChanges = {
      addedNodes: index === 0 ? currentState.visitedNodes : addedNodes,
      removedNodes: removedNodes,
      addedEdges: addedEdges,
      removedEdges: removedEdges,
    }

    return stateChanges;
  };

  const animateBFS = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];
    const differenceMessage = switchDirection === "back" ? findStateChanges(nextState, currentState, index) : findStateChanges(prevState, currentState, index);

    differenceMessage.addedNodes.forEach(node => {
      cyRef.current!.getElementById(node).addClass("visited");
    });
    differenceMessage.removedNodes.forEach(node => {
      cyRef.current!.getElementById(node).removeClass("visited");
    });
    differenceMessage.addedEdges.forEach(edge => {
      cyRef.current!.getElementById(edge).addClass("visited");
    });
    differenceMessage.removedEdges.forEach(edge => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    });

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateBFS(index + 1);
        } else {
          animateBFS(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateDFS = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];
    const differenceMessage = switchDirection === "back" ? findStateChanges(nextState, currentState, index) : findStateChanges(prevState, currentState, index);
    //const differenceMessage = switchDirection === "back" ? findStateChanges(currentState, prevState, index) : findStateChanges(prevState, currentState, index);

    differenceMessage.addedNodes.forEach(node => {
      cyRef.current!.getElementById(node).addClass("visited");
    });
    differenceMessage.removedNodes.forEach(node => {
      cyRef.current!.getElementById(node).removeClass("visited");
    });
    differenceMessage.addedEdges.forEach(edge => {
      cyRef.current!.getElementById(edge).addClass("visited");
    });
    differenceMessage.removedEdges.forEach(edge => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    });

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateDFS(index + 1);
        } else {
          animateDFS(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateDijkstra = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    if (switchDirection === "back") {
      if (nextState.currentNode !== currentState.currentNode) {
        cyRef.current!.getElementById(nextState.currentNode).removeClass("processing");
        cyRef.current!.getElementById(currentState.currentNode).addClass("processing");
      }
      if (nextState.currentEdge !== currentState.currentEdge) {
        cyRef.current!.getElementById(nextState.currentEdge).removeClass("processing");
        cyRef.current!.getElementById(currentState.currentEdge).addClass("processing");
      }
    } else {
      if (prevState.currentNode !== currentState.currentNode) {
        cyRef.current!.getElementById(prevState.currentNode).removeClass("processing");
        cyRef.current!.getElementById(currentState.currentNode).addClass("processing");
      }
      if (prevState.currentEdge !== currentState.currentEdge) {
        cyRef.current!.getElementById(prevState.currentEdge).removeClass("processing");
        cyRef.current!.getElementById(currentState.currentEdge).addClass("processing");
      }
    }

    const findDifferences = (prevState: any, currentState: any, index: number) => {
      const addedNodes = currentState.fullyProcessedNodes.filter(
        (x: string) => !prevState.fullyProcessedNodes.includes(x)
      );
      const removedNodes = prevState.fullyProcessedNodes.filter(
        (x: string) => !currentState.fullyProcessedNodes.includes(x)
      );

      return { addedNodes, removedNodes };
    }

    const { addedNodes, removedNodes } = switchDirection === "back" ? findDifferences(nextState, currentState, index) : findDifferences(prevState, currentState, index);
    
    addedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("processed");
    })
    removedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("processed");
    })
    
    if (currentState.pathNodes.length > 0 && currentState.pathEdges.length > 0) {
      currentState.pathNodes.forEach((node: string) => {
        cyRef.current!.getElementById(node).addClass("visited");
      })
      currentState.pathEdges.forEach((edge: string) => {
        cyRef.current!.getElementById(edge).addClass("visited");
      })
    }
    else {
      cyRef.current!.elements().removeClass("visited");
    }

    for (const key in currentState.paths) {
      if (currentState.paths.hasOwnProperty(key)) {
        const labelId = `label-for-${key}`;
        const label = nodeLabels.current[labelId];
        if (label) {
          if (currentState.pathUpdateInfo && currentState.nextNode === key) {
            label.innerHTML = currentState.pathUpdateInfo;
          } else {
            label.innerHTML = currentState.paths[key];
          }
        }
      }
    }

    /*if (currentState.pathUpdateInfo) {
      const labelId = `label-for-${currentState.nextNode}`
      const label = nodeLabels.current[labelId];
      if (label) {
        label.innerHTML = currentState.pathUpdateInfo;
      }
    }*/

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateDijkstra(index + 1);
        } else {
          animateDijkstra(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateBellmanFord = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    if (switchDirection === "back") {
      if (nextState.currentEdge !== currentState.currentEdge) {
        cyRef.current!.getElementById(nextState.currentEdge).removeClass("processing");
        cyRef.current!.getElementById(currentState.currentEdge).addClass("processing");
      }
    } else {
      if (prevState.currentEdge !== currentState.currentEdge) {
        cyRef.current!.getElementById(prevState.currentEdge).removeClass("processing");
        cyRef.current!.getElementById(currentState.currentEdge).addClass("processing");
      }
    }
    
    if (currentState.pathNodes.length > 0 && currentState.pathEdges.length > 0) {
      currentState.pathNodes.forEach((node: string) => {
        cyRef.current!.getElementById(node).addClass("visited");
      })
      currentState.pathEdges.forEach((edge: string) => {
        cyRef.current!.getElementById(edge).addClass("visited");
      })
    }
    else {
      cyRef.current!.elements().removeClass("visited");
    }

    for (const key in currentState.paths) {
      if (currentState.paths.hasOwnProperty(key)) {
        const labelId = `label-for-${key}`;
        const label = nodeLabels.current[labelId];
        if (label) {
          if (currentState.pathUpdateInfo && currentState.nextNode === key) {
            label.innerHTML = currentState.pathUpdateInfo;
          } else {
            label.innerHTML = currentState.paths[key];
          }
        }
      }
    }

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateBellmanFord(index + 1);
        } else {
          animateBellmanFord(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animatePrim = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    const findDifferences = (prevState: any, currentState: any, index: number) => {
      const addedNodes = currentState.mstNodes.filter(
        (x: string) => !prevState.mstNodes.includes(x)
      );
      const removedNodes = prevState.mstNodes.filter(
        (x: string) => !currentState.mstNodes.includes(x)
      );
      const addedEdges = currentState.mstEdges.filter(
        (x: string) => !prevState.mstEdges.includes(x)
      );
      const removedEdges = prevState.mstEdges.filter(
        (x: string) => !currentState.mstEdges.includes(x)
      );

      return {
        addedNodes: index === 0 ? currentState.mstNodes : addedNodes,
        removedNodes,
        addedEdges,
        removedEdges,
      };
    };

    const { addedNodes, removedNodes, addedEdges, removedEdges } = switchDirection === "back" ? findDifferences(nextState, currentState, index) : findDifferences(prevState, currentState, index);
    
    addedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("visited");
    })
    removedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("visited");
    })
    addedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("visited");
    })
    removedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    })

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animatePrim(index + 1);
        } else {
          animatePrim(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateKruskal = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    if (currentState.currentEdge) {
      cyRef.current!.getElementById(currentState.currentEdge).addClass("processing");
    } else if (switchDirection === "forward" && prevState.currentEdge) {
      cyRef.current!.getElementById(prevState.currentEdge).removeClass("processing");
    } else if (switchDirection === "back" && nextState.currentEdge) {
      cyRef.current!.getElementById(nextState.currentEdge).removeClass("processing");
    }

    const findDifferences = (prevState: any, currentState: any, index: number) => {
      const addedNodes = currentState.mstNodes.filter(
        (x: string) => !prevState.mstNodes.includes(x)
      );
      const removedNodes = prevState.mstNodes.filter(
        (x: string) => !currentState.mstNodes.includes(x)
      );
      const addedEdges = currentState.mstEdges.filter(
        (x: string) => !prevState.mstEdges.includes(x)
      );
      const removedEdges = prevState.mstEdges.filter(
        (x: string) => !currentState.mstEdges.includes(x)
      );

      return {
        addedNodes: index === 0 ? currentState.mstNodes : addedNodes,
        removedNodes,
        addedEdges,
        removedEdges,
      };
    };

    const { addedNodes, removedNodes, addedEdges, removedEdges } = switchDirection === "back" ? findDifferences(nextState, currentState, index) : findDifferences(prevState, currentState, index);
    
    addedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("visited");
    })
    removedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("visited");
    })
    addedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("visited");
    })
    removedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    })

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateKruskal(index + 1);
        } else {
          animateKruskal(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateTarjan = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    const findDifferences = (prevState: any, currentState: any, index: number) => {
      const addedNodes = currentState.visitedNodes.filter(
        (x: string) => !prevState.visitedNodes.includes(x)
      );
      const removedNodes = prevState.visitedNodes.filter(
        (x: string) => !currentState.visitedNodes.includes(x)
      );
      const addedEdges = currentState.visitedEdges.filter(
        (x: string) => !prevState.visitedEdges.includes(x)
      );
      const removedEdges = prevState.visitedEdges.filter(
        (x: string) => !currentState.visitedEdges.includes(x)
      );
      const addedSCCNodes = currentState.sccsNodes.filter(
        (x: string) => !prevState.sccsNodes.includes(x)
      );
      const removedSCCNodes = prevState.sccsNodes.filter(
        (x: string) => !currentState.sccsNodes.includes(x)
      );
      const addedSCCEdges = currentState.sccsEdges.filter(
        (x: string) => !prevState.sccsEdges.includes(x)
      );
      const removedSCCEdges = prevState.sccsEdges.filter(
        (x: string) => !currentState.sccsEdges.includes(x)
      );

      return {
        addedNodes: index === 0 ? currentState.visitedNodes : addedNodes,
        removedNodes,
        addedEdges,
        removedEdges,
        addedSCCNodes,
        removedSCCNodes,
        addedSCCEdges,
        removedSCCEdges,
      };
    };

    const { addedNodes, removedNodes, addedEdges, removedEdges, addedSCCNodes, removedSCCNodes, addedSCCEdges, removedSCCEdges } = switchDirection === "back" ? findDifferences(nextState, currentState, index) : findDifferences(prevState, currentState, index);
    
    addedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("processing");
    })
    removedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("processing");
    })
    addedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("processing");
    })
    removedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("processing");
    })
    addedSCCNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("visited");
    })
    removedSCCNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("visited");
    })
    addedSCCEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("visited");
    })
    removedSCCEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    })

    for (const key in currentState.nodesLabels) {
      if (currentState.nodesLabels.hasOwnProperty(key)) {
        const labelId = `label-for-${key}`;
        const label = nodeLabels.current[labelId];
        if (label) {
          label.innerHTML = currentState.nodesLabels[key];
        }
      }
    }

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateTarjan(index + 1);
        } else {
          animateTarjan(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateTopologicalSort = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    const findDifferences = (prevState: any, currentState: any, index: number) => {
      const addedVisitedNodes = currentState.visitedNodes.filter(
        (x: string) => !prevState.visitedNodes.includes(x)
      );
      const removedVisitedNodes = prevState.visitedNodes.filter(
        (x: string) => !currentState.visitedNodes.includes(x)
      );
      const addedEdges = currentState.visitedEdges.filter(
        (x: string) => !prevState.visitedEdges.includes(x)
      );
      const removedEdges = prevState.visitedEdges.filter(
        (x: string) => !currentState.visitedEdges.includes(x)
      );
      const addedVisitingNodes = currentState.visitingNodes.filter(
        (x: string) => !prevState.visitingNodes.includes(x)
      );
      const removedVisitingNodes = prevState.visitingNodes.filter(
        (x: string) => !currentState.visitingNodes.includes(x)
      );

      return {
        addedVisitedNodes,
        removedVisitedNodes,
        addedEdges,
        removedEdges,
        addedVisitingNodes,
        removedVisitingNodes,
      };
    };

    const { addedVisitedNodes, removedVisitedNodes, addedEdges, removedEdges, addedVisitingNodes, removedVisitingNodes } = switchDirection === "back" ? findDifferences(nextState, currentState, index) : findDifferences(prevState, currentState, index);
    
    addedVisitedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("processed");
    })
    removedVisitedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("processed");
    })
    addedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("visited");
    })
    removedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    })
    addedVisitingNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("visited");
    })
    removedVisitingNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("visited");
    })

    for (const key in currentState.nodesLabels) {
      if (currentState.nodesLabels.hasOwnProperty(key)) {
        const labelId = `label-for-${key}`;
        const label = nodeLabels.current[labelId];
        if (label) {
          label.innerHTML = currentState.nodesLabels[key];
        }
      }
    }

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateTopologicalSort(index + 1);
        } else {
          animateTopologicalSort(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateGraphColoring = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];
      
    if (switchDirection === "back") {
      if (nextState.currentNode !== currentState.currentNode) {
        cyRef.current!.getElementById(nextState.currentNode).removeClass("processed");
        cyRef.current!.getElementById(currentState.currentNode).addClass("processed");
      }
    } else {
      if (prevState.currentNode !== currentState.currentNode) {
        cyRef.current!.getElementById(prevState.currentNode).removeClass("processed");
        cyRef.current!.getElementById(currentState.currentNode).addClass("processed");
      }
    }

    for (const key in currentState.nodesColors) {
      if (currentState.nodesColors.hasOwnProperty(key)) {
        if (currentState.nodesColors[key] === 0) {
          cyRef.current!.getElementById(key).removeClass("color-1");
          cyRef.current!.getElementById(key).removeClass("color-2");
          cyRef.current!.getElementById(key).removeClass("color-3");
          cyRef.current!.getElementById(key).removeClass("color-4");
          cyRef.current!.getElementById(key).removeClass("color-5");
        }
        else {
          cyRef.current!.getElementById(key).addClass(`color-${currentState.nodesColors[key]}`);
        }
      }
    }

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateGraphColoring(index + 1);
        } else {
          animateGraphColoring(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateEdmondsKarp = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];
    
    const findDifferences = (prevState: any, currentState: any, index: number) => {
      const addedVisitedNodes = currentState.visitedNodes.filter(
        (x: string) => !prevState.visitedNodes.includes(x)
      );
      const removedVisitedNodes = prevState.visitedNodes.filter(
        (x: string) => !currentState.visitedNodes.includes(x)
      );
      const addedVisitedEdges = currentState.visitedEdges.filter(
        (x: string) => !prevState.visitedEdges.includes(x)
      );
      const removedVisitedEdges = prevState.visitedEdges.filter(
        (x: string) => !currentState.visitedEdges.includes(x)
      );
      const addedCurrentPathNodes = currentState.currentPathNodes.filter(
        (x: string) => !prevState.currentPathNodes.includes(x)
      );
      const removedCurrrentPathNodes = prevState.currentPathNodes.filter(
        (x: string) => !currentState.currentPathNodes.includes(x)
      );
      const addedCurrentPathEdges = currentState.currentPathEdges.filter(
        (x: string) => !prevState.currentPathEdges.includes(x)
      );
      const removedCurrrentPathEdges = prevState.currentPathEdges.filter(
        (x: string) => !currentState.currentPathEdges.includes(x)
      );

      return {
        addedVisitedNodes,
        removedVisitedNodes,
        addedVisitedEdges,
        removedVisitedEdges,
        addedCurrentPathNodes,
        removedCurrrentPathNodes,
        addedCurrentPathEdges,
        removedCurrrentPathEdges
      };
    };

    const {
      addedVisitedNodes,
      removedVisitedNodes,
      addedVisitedEdges,
      removedVisitedEdges,
      addedCurrentPathNodes,
      removedCurrrentPathNodes,
      addedCurrentPathEdges,
      removedCurrrentPathEdges,
    } =
      switchDirection === "back"
        ? findDifferences(nextState, currentState, index)
        : findDifferences(prevState, currentState, index);
    
    addedVisitedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("visited");
    })
    removedVisitedNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("visited");
    })
    addedVisitedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("visited");
    })
    removedVisitedEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("visited");
    })
    addedCurrentPathNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).addClass("processing");
    })
    removedCurrrentPathNodes.forEach((node: string) => {
      cyRef.current!.getElementById(node).removeClass("processing");
    })
    addedCurrentPathEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).addClass("processing");
    })
    removedCurrrentPathEdges.forEach((edge: string) => {
      cyRef.current!.getElementById(edge).removeClass("processing");
    })

    for (const key in currentState.flows) {
      if (currentState.flows.hasOwnProperty(key)) {
        cyRef.current!.getElementById(key).data("flow", currentState.flows[key]);
      }
    }

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateEdmondsKarp(index + 1);
        } else {
          animateEdmondsKarp(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const animateCalculateDegrees = (index: number = 0, manualSwitch: boolean = false, switchDirection: "back" | "forward" = "forward") => {
    if (!isAnimationPlaying.current && !manualSwitch) return;

    animationFrame.current = index;
    const prevState = animationFrames.current[(index - 1 + animationFrames.current.length) % animationFrames.current.length];
    const currentState = animationFrames.current[index];
    const nextState = animationFrames.current[(index + 1) % animationFrames.current.length];

    if (switchDirection === "back") {
      if (nextState.currentNode !== currentState.currentNode) {
        cyRef.current!.getElementById(nextState.currentNode).removeClass("visited");
        cyRef.current!.getElementById(currentState.currentNode).addClass("visited");
      }
      if (nextState.currentEdge !== currentState.currentEdge) {
        cyRef.current!.getElementById(nextState.currentEdge).removeClass("visited");
        cyRef.current!.getElementById(currentState.currentEdge).addClass("visited");
      }
    } else {
      if (prevState.currentNode !== currentState.currentNode) {
        cyRef.current!.getElementById(prevState.currentNode).removeClass("visited");
        cyRef.current!.getElementById(currentState.currentNode).addClass("visited");
      }
      if (prevState.currentEdge !== currentState.currentEdge) {
        cyRef.current!.getElementById(prevState.currentEdge).removeClass("visited");
        cyRef.current!.getElementById(currentState.currentEdge).addClass("visited");
      }
    }

    for (const key in currentState.degrees) {
      if (currentState.degrees.hasOwnProperty(key)) {
        const labelId = `label-for-${key}`;
        const label = nodeLabels.current[labelId];
        if (label) {
          if (typeof currentState.degrees[key] === 'number') {
            label.innerHTML = `Степень: ${currentState.degrees[key]}`;
          } else {
            label.innerHTML = `Исход: ${currentState.degrees[key].out}, Заход: ${currentState.degrees[key].in}`;
          }
          
        }
      }
    }

    if (!loopedMode.current && index + 1 >= animationFrames.current.length) {
      pauseAnimation();
      isAnimationEnded.current = true;
    } else {
      isAnimationEnded.current = false;
    }

    if (isAnimationPlaying.current) {
      setTimeout(() => {
        if (index + 1 < animationFrames.current.length) {
          animateCalculateDegrees(index + 1);
        } else {
          animateCalculateDegrees(0);
        }
      }, 900 / animationSpeed.current);
    }
  };

  const playAnimation = () => {
    isAnimationPlaying.current = true;
    setIsPlaying(true);
    if (manualSwitch) {
      setTooltipContent(resultText);
      setManualSwitch(false);
    }
    switch (selectedAlgorithm.current) {
      case "bfs": {
        animateBFS(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "dfs": {
        animateDFS(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "dijkstra": {
        animateDijkstra(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "bellmanFord": {
        animateBellmanFord(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "prim": {
        animatePrim(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "kruskal": {
        animateKruskal(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "tarjan": {
        animateTarjan(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "topologicalSort": {
        animateTopologicalSort(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "graphColoring": {
        animateGraphColoring(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "edmondsKarp": {
        animateEdmondsKarp(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
      case "calculateDegrees": {
        animateCalculateDegrees(isAnimationEnded.current ? 0 : animationFrame.current);
        break;
      }
    }
  };

  const pauseAnimation = () => {
    isAnimationPlaying.current = false;
    setIsPlaying(false);
  };

  const stopAnimation = (needDisable: boolean) => {
    setIsAnimationReady(false);
    setAlgorithmDetails("");
    animationFrames.current = [];
    animationFrame.current = 0;
    isAnimationPlaying.current = false;
    setIsPlaying(false);
    switch (selectedAlgorithm.current) {
      case "bfs": {
        stopBFS(needDisable);
        break;
      }
      case "dfs": {
        stopDFS(needDisable);
        break;
      }
      case "dijkstra": {
        stopDijkstra(needDisable);
        break;
      }
      case "bellmanFord": {
        stopBellmanFord(needDisable);
        break;
      }
      case "prim": {
        stopPrim(needDisable);
        break;
      }
      case "kruskal": {
        stopKruskal(needDisable);
        break;
      }
      case "tarjan": {
        stopTarjan(needDisable);
        break;
      }
      case "topologicalSort": {
        stopTopologicalSort(needDisable);
        break;
      }
      case "graphColoring": {
        stopGraphColoring(needDisable);
        break;
      }
      case "edmondsKarp": {
        stopEdmondsKarp(needDisable);
        break;
      }
      case "calculateDegrees": {
        stopCalculateDegrees(needDisable);
        break;
      }
    }
  };

  const stopBFS = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("visited");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["bfs"]);
    }
  }

  const stopDFS = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("visited");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["dfs"]);
    }
  }

  const stopDijkstra = (needDisable: boolean) => {
    cyRef.current!.nodes().removeClass("selected");
    cyRef.current!.elements().removeClass("processing");
    cyRef.current!.nodes().removeClass("processed");
    cyRef.current!.elements().removeClass("visited");
    clearLabels();
    setSourceNode("");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["dijkstra"]);
    }
  }

  const stopBellmanFord = (needDisable: boolean) => {
    cyRef.current!.nodes().removeClass("selected");
    cyRef.current!.elements().removeClass("processing");
    cyRef.current!.elements().removeClass("visited");
    clearLabels();
    setSourceNode("");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["bellmanFord"]);
    }
  }

  const stopPrim = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("visited");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["prim"]);
      setIsJustStartAlgorithm(true);
    }
  }

  const stopKruskal = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("visited");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["kruskal"]);
      setIsJustStartAlgorithm(true);
    }
  }

  const stopTarjan = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("processing");
    cyRef.current!.elements().removeClass("visited");
    clearLabels();
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["tarjan"]);
      setIsJustStartAlgorithm(true);
    }
  }

  const stopTopologicalSort = (needDisable: boolean) => {
    cyRef.current!.nodes().removeClass("processed");
    cyRef.current!.elements().removeClass("visited");
    clearLabels();
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["topologicalSort"]);
      setIsJustStartAlgorithm(true);
    }
  }

  const stopGraphColoring = (needDisable: boolean) => {
    cyRef.current!.nodes().removeClass("color-1");
    cyRef.current!.nodes().removeClass("color-2");
    cyRef.current!.nodes().removeClass("color-3");
    cyRef.current!.nodes().removeClass("color-4");
    cyRef.current!.nodes().removeClass("color-5");
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["graphColoring"]);
      setIsJustStartAlgorithm(true);
    }
  }

  const stopEdmondsKarp = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("visited");
    cyRef.current!.elements().removeClass("processing");
    cyRef.current!.edges().forEach(edge => {
      edge.data("flow", 0);
    })
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["graphColoring"]);
      setIsJustStartAlgorithm(true);
    }
  }

  const stopCalculateDegrees = (needDisable: boolean) => {
    cyRef.current!.elements().removeClass("visited");
    clearLabels();
    if (!needDisable) {
      setTooltipContent(algorithmTooltips["calculateDegrees"]);
    }
  }

  const clearLabels = () => {
    Object.values(nodeLabels.current).forEach(label => {
      label.innerHTML = "";
    });
  }

  const stepForward = () => {
    pauseAnimation();
    if (!manualSwitch) {
      setManualSwitch(true);
    }
    animationFrame.current = animationFrame.current >= animationFrames.current.length - 1 ? 0 : animationFrame.current + 1;
    if (animationFrame.current + 1 >= animationFrames.current.length) {
      setTooltipContent(`${stepByStepExplanation[animationFrame.current]}${stepByStepExplanation[animationFrame.current] !== resultText ? "  \n" + resultText : ""}`)
    } else {
      setTooltipContent(stepByStepExplanation[animationFrame.current]);
    }
    //setTooltipContent(`${stepByStepExplanation[animationFrame.current]}${animationFrame.current + 1 >= animationFrames.current.length ? "\n\n" + resultText : ""}`);
    switch (selectedAlgorithm.current) {
      case "bfs": {
        animateBFS(animationFrame.current, true);
        break;
      }
      case "dfs": {
        animateDFS(animationFrame.current, true);
        break;
      }
      case "dijkstra": {
        animateDijkstra(animationFrame.current, true);
        break;
      }
      case "bellmanFord": {
        animateBellmanFord(animationFrame.current, true);
        break;
      }
      case "prim": {
        animatePrim(animationFrame.current, true);
        break;
      }
      case "kruskal": {
        animateKruskal(animationFrame.current, true);
        break;
      }
      case "tarjan": {
        animateTarjan(animationFrame.current, true);
        break;
      }
      case "topologicalSort": {
        animateTopologicalSort(animationFrame.current, true);
        break;
      }
      case "graphColoring": {
        animateGraphColoring(animationFrame.current, true);
        break;
      }
      case "edmondsKarp": {
        animateEdmondsKarp(animationFrame.current, true);
        break;
      }
      case "calculateDegrees": {
        animateCalculateDegrees(animationFrame.current, true);
        break;
      }
    }
  }

  const stepBack = () => {
    pauseAnimation();
    if (!manualSwitch) {
      setManualSwitch(true);
    }
    animationFrame.current = animationFrame.current === 0 ? animationFrames.current.length - 1 : animationFrame.current - 1;
    if (animationFrame.current + 1 >= animationFrames.current.length) {
      setTooltipContent(`${stepByStepExplanation[animationFrame.current]}${stepByStepExplanation[animationFrame.current] !== resultText ? "  \n" + resultText : ""}`)
    } else {
      setTooltipContent(stepByStepExplanation[animationFrame.current]);
    }
    switch (selectedAlgorithm.current) {
      case "bfs": {
        animateBFS(animationFrame.current, true, "back");
        break;
      }
      case "dfs": {
        animateDFS(animationFrame.current, true, "back");
        break;
      }
      case "dijkstra": {
        animateDijkstra(animationFrame.current, true, "back");
        break;
      }
      case "bellmanFord": {
        animateBellmanFord(animationFrame.current, true, "back");
        break;
      }
      case "prim": {
        animatePrim(animationFrame.current, true, "back");
        break;
      }
      case "kruskal": {
        animateKruskal(animationFrame.current, true, "back");
        break;
      }
      case "tarjan": {
        animateTarjan(animationFrame.current, true, "back");
        break;
      }
      case "topologicalSort": {
        animateTopologicalSort(animationFrame.current, true, "back");
        break;
      }
      case "topologicalSort": {
        animateTopologicalSort(animationFrame.current, true, "back");
        break;
      }
      case "graphColoring": {
        animateGraphColoring(animationFrame.current, true, "back");
        break;
      }
      case "edmondsKarp": {
        animateEdmondsKarp(animationFrame.current, true, "back");
        break;
      }
      case "calculateDegrees": {
        animateCalculateDegrees(animationFrame.current, true, "back");
        break;
      }
    }
    //animationFrame.current = animationFrame.current === 0 ? animationFrames.current.length - 1 : animationFrame.current - 1;
  }

  const saveGraph = () => {
    const state = cyRef.current!.json() as CyState;
    delete state.style;
    delete state.zoom;
    delete state.pan;
    localStorage.setItem('userGraph', JSON.stringify(state));
  };

  const saveState = (graphState?: object) => {
    const state: CyState = graphState ? graphState as CyState : cyRef.current!.json() as CyState;
    delete state.style;
    delete state.zoom;
    delete state.pan;
    if (undoStack.current.length >= maxHistorySize) {
      undoStack.current.shift();
    }
    undoStack.current.push(state);
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
  };

  const undo = () => {
    if (undoStack.current.length > 0) {
      const currentState = cyRef.current!.json() as CyState;
      delete currentState.style;
      delete currentState.zoom;
      delete currentState.pan;
      const prevState = undoStack.current.pop();
      redoStack.current.push(currentState);
      cyRef.current!.json(prevState!);
      setUndoCount(undoStack.current.length);
      setRedoCount(redoStack.current.length);
      applyStyles();
      saveGraph();
    }
  };

  const redo = () => {
    if (redoStack.current.length > 0) {
      const currentState = cyRef.current!.json() as CyState;
      delete currentState.style;
      delete currentState.zoom;
      delete currentState.pan;
      const nextState = redoStack.current.pop();
      undoStack.current.push(currentState);
      cyRef.current!.json(nextState!);
      setUndoCount(undoStack.current.length);
      setRedoCount(redoStack.current.length);
      applyStyles();
      saveGraph();
    }
  };

  const clearGraph = () => {
    saveState();
    cyRef.current!.elements().remove();
    saveGraph();
  }

  const applyStyles = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const style = getThemeStyles(currentTheme!);
    cyRef.current!.style(style);
  }

  const getThemeStyles = useCallback((theme: string): Stylesheet[] => {
    if (theme === 'light') {
      return [
        {
          selector: "node",
          style: {
            "background-color": "#dce0e8",
            "border-width": "1px",
            "border-color": "#4c4f69",
            color: "#4c4f69",
            label: "data(title)",
            "font-size": "12px",
            "text-valign": (node: NodeSingular) => node.data('title').length <= 3 ? 'center' : 'top',
            "text-halign": "center",
            "text-margin-y": (node: NodeSingular) => node.data('title').length <= 3 ? 0 : -6,
            "text-background-color": "#eff1f5",
            "text-background-opacity": (node: NodeSingular) => node.data('title').length <= 3 ? 0 : 1,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#4c4f69",
            "target-arrow-color": "#4c4f69",
            "curve-style": "bezier",
            label: (edge: EdgeSingular) => {
              const title = edge.data("title");
              const weight = edge.data("displayedWeight");

              if (title) {
                return `${title} ${weight ? `(${weight})` : ""}`;
              } else {
                return `${weight}`;
              }
            },
            "text-background-color": "#eff1f5",
            "text-background-opacity": 1,
            "font-size": "12px",
            "color": "#4c4f69",
            "text-margin-y": -12,
          },
        },
        {
          selector: "*",
          style: {
            "overlay-color": "#9ca0b0",
            "active-bg-color": "#9ca0b0",
          }
        },
        {
          selector: "core",
          style: {
            "active-bg-color": "#9ca0b0",
            "active-bg-opacity": 0.32,
            "active-bg-size": 32,
            "selection-box-color": "#9ca0b0",
            "selection-box-opacity": 0.32,
            "selection-box-border-color": "transparent",
            "selection-box-border-width": 0,
            "outside-texture-bg-color": "transparent",
            "outside-texture-bg-opacity": 1,
          }
        },
        {
          selector: ".selected",
          style: {
            "background-color": "#4c4f69",
            "border-color": "#dce0e8",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#dce0e8" : "#4c4f69",
          },
        },
        {
          selector: ".oriented",
          style: {
            "target-arrow-shape": "triangle",
          }
        },
        {
          selector: "node.visited",
          style: {
            "background-color": "#e64553",
            "border-color": "#d20f39",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#d20f39",
          }
        },
        {
          selector: "edge.visited",
          style: {
            "line-color": "#d20f39",
            "target-arrow-color": "#d20f39",
            color: "#d20f39",
          }
        },
        {
          selector: "node.processing",
          style: {
            "background-color": "#fe640b",
            "border-color": "#fe640b",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#fe640b",
          }
        },
        {
          selector: "edge.processing",
          style: {
            "line-color": "#fe640b",
            "target-arrow-color": "#fe640b",
            color: "#fe640b",
          }
        },
        {
          selector: "node.processed",
          style: {
            "background-color": "#bcc0cc",
            "border-color": "#bcc0cc",
            color: "#4c4f69",
          }
        },
        {
          selector: "node.color-1",
          style: {
            "background-color": "#e64553",
            "border-color": "#d20f39",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#d20f39",
          }
        },
        {
          selector: "node.color-2",
          style: {
            "background-color": "#fe640b",
            "border-color": "#fe640b",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#fe640b",
          }
        },
        {
          selector: "node.color-3",
          style: {
            "background-color": "#8839ef",
            "border-color": "#8839ef",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#8839ef",
          }
        },
        {
          selector: "node.color-4",
          style: {
            "background-color": "#df8e1d",
            "border-color": "#df8e1d",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#df8e1d",
          }
        },
        {
          selector: "node.color-5",
          style: {
            "background-color": "#7287fd",
            "border-color": "#7287fd",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#7287fd",
          }
        },
        {
          selector: "edge.flow-display",
          style: {
            label: (edge: EdgeSingular) => {
              const title = edge.data("title");
              const weight = edge.data("weight");
              const flow = edge.data("flow");

              if (title) {
                return `${title} ${`(${flow}/${weight})`}`;
              } else {
                return `${flow}/${weight}`;
              }
            },
          }
        },
      ];
    } else {
      return [
        {
          selector: "node",
          style: {
            "background-color": "#292c3c",
            "border-width": "1px",
            "border-color": "#c6d0f5",
            color: "#c6d0f5",
            label: "data(title)",
            "font-size": "12px",
            "text-valign": (node: NodeSingular) => node.data('title').length <= 3 ? 'center' : 'top',
            "text-halign": "center",
            "text-margin-y": (node: NodeSingular) => node.data('title').length <= 3 ? 0 : -6,
            "text-background-color": "#303446",
            "text-background-opacity": (node: NodeSingular) => node.data('title').length <= 3 ? 0 : 1,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#c6d0f5",
            "target-arrow-color": "#c6d0f5",
            "curve-style": "bezier",
            label: (edge: EdgeSingular) => {
              const title = edge.data("title");
              const weight = edge.data("displayedWeight");

              if (title) {
                return `${title} ${weight ? `(${weight})` : ""}`;
              } else {
                return `${weight}`;
              }
            },
            "text-background-color": "#303446",
            "text-background-opacity": 1,
            "font-size": "12px",
            "color": "#c6d0f5",
            "text-margin-y": -12,
          },
        },
        {
          selector: "*",
          style: {
            "overlay-color": "#737994",
          }
        },
        {
          selector: "core",
          style: {
            "active-bg-color": "#737994",
            "active-bg-opacity": 0.32,
            "active-bg-size": 32,
            "selection-box-color": "#737994",
            "selection-box-opacity": 0.32,
            "selection-box-border-color": "transparent",
            "selection-box-border-width": 0,
            "outside-texture-bg-color": "transparent",
            "outside-texture-bg-opacity": 1,
          }
        },
        {
          selector: ".selected",
          style: {
            "background-color": "#c6d0f5",
            "border-color": "#292c3c",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#292c3c" : "#c6d0f5",
          },
        },
        {
          selector: ".oriented",
          style: {
            "target-arrow-shape": "triangle",
          }
        },
        {
          selector: "node.visited",
          style: {
            "background-color": "#ea999c",
            "border-color": "#e78284",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#e78284",
          }
        },
        {
          selector: "edge.visited",
          style: {
            "line-color": "#e78284",
            "target-arrow-color": "#e78284",
            color: "#e78284",
          }
        },
        {
          selector: "node.processing",
          style: {
            "background-color": "#ef9f76",
            "border-color": "#ef9f76",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#ef9f76",
          }
        },
        {
          selector: "edge.processing",
          style: {
            "line-color": "#ef9f76",
            "target-arrow-color": "#ef9f76",
            color: "#ef9f76",
          }
        },
        {
          selector: "node.processed",
          style: {
            "background-color": "#51576d",
            "border-color": "#51576d",
            color: "#c6d0f5",
          }
        },
        {
          selector: "node.color-1",
          style: {
            "background-color": "#ea999c",
            "border-color": "#e78284",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#e78284",
          }
        },
        {
          selector: "node.color-2",
          style: {
            "background-color": "#ef9f76",
            "border-color": "#ef9f76",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#ef9f76",
          }
        },
        {
          selector: "node.color-3",
          style: {
            "background-color": "#ca9ee6",
            "border-color": "#ca9ee6",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#ca9ee6",
          }
        },
        {
          selector: "node.color-4",
          style: {
            "background-color": "#e5c890",
            "border-color": "#e5c890",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#e5c890",
          }
        },
        {
          selector: "node.color-5",
          style: {
            "background-color": "#babbf1",
            "border-color": "#babbf1",
            color: (node: NodeSingular) => node.data('title').length <= 3 ? "#eff1f5" : "#babbf1",
          }
        },
      ];
    }
  }, []);

  const contextValue = {
    cyRef,
    getThemeStyles,
    checked,
    setChecked,
    showGrid,
    toggleGrid,
    tooltipContent,
    setTooltipContent,
    addNodeMode,
    toggleAddNodeMode,
    addEdgeMode,
    toggleAddEdgeMode,
    deleteMode,
    toggleDeleteMode,
    undoCount,
    redoCount,
    saveGraph,
    saveState,
    undo,
    redo,
    clearGraph,
    sourceNode,
    setSourceNode,
    algorithmMode,
    selectedAlgorithm,
    enableAlgorithmMode,
    disableAlgorithmMode,
    algorithmDetails,
    setAlgorithmDetails,
    isAnimationReady,
    isAnimationPlaying,
    isPlaying,
    animationSpeed,
    loopedMode,
    isJustStartAlgorithm,
    isLoading,
    setIsLoading,
    startAlgorithm,
    toggleLoopedMode,
    increaseMultiplier,
    decreaseMultiplier,
    startAnimation,
    playAnimation,
    pauseAnimation,
    stopAnimation,
    stepForward,
    stepBack,
    setStepByStepExplanation,
    setResultText,
  };

  return (
    <GraphEditorContext.Provider value={ contextValue }>
      {children}
    </GraphEditorContext.Provider>
  );
};
