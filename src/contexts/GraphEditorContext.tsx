"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  const [isAnimationEnded, setIsAnimationEnded] = useState(false);
  const [stepByStepExplanation, setStepByStepExplanation] = useState<string[]>([]);
  const [resultText, setResultText] = useState("");
  const [manualSwitch, setManualSwitch] = useState(false);
  //const [animationFrames, setAnimationFrames] = useState<State[]>([]);
  const cyRef = useRef<Core | null>(null);
  const undoStack = useRef<CyState[]>([]);
  const redoStack = useRef<CyState[]>([]);
  const selectedAlgorithm = useRef("");
  const isAnimationPlaying = useRef(false);
  const animationFrame = useRef(0);
  const animationFrames = useRef<State[]>([]);
  const animationSpeed = useRef(speedMultipliers[1]);
  const loopedMode = useRef(false);
  const maxHistorySize = 20;
  const algorithmTooltips: StringKeyValue = {
    bfs: "Чтобы запустить алгоритм поиска в ширину, выберите начальную вершину, с которой будет начинаться поиск",
    dfs: "Чтобы запустить алгоритм поиска в глубину, выберите начальную вершину, с которой будет начинаться поиск",
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
    if (selectedAlgorithm.current !== algorithmSlug) {
      if (selectedAlgorithm.current !== "") {
        stopAnimation(false);
      }
      selectedAlgorithm.current = algorithmSlug;
      setTooltipContent(algorithmTooltips[algorithmSlug]);
    }
  };

  const disableAlgorithmMode = () => {
    setAlgorithmMode(false);
    setTooltipContent("");
    stopAnimation(true);
    selectedAlgorithm.current = "";
  };

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
    const differenceMessage = switchDirection === "back" ? findStateChanges(currentState, prevState, index) : findStateChanges(prevState, currentState, index);

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
      setIsAnimationEnded(true);
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
    const differenceMessage = switchDirection === "back" ? findStateChanges(currentState, prevState, index) : findStateChanges(prevState, currentState, index);

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
      setIsAnimationEnded(true);
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

  const playAnimation = () => {
    isAnimationPlaying.current = true;
    setIsPlaying(true);
    setIsAnimationEnded(false);
    if (manualSwitch) {
      setTooltipContent(resultText);
      setManualSwitch(false);
    }
    switch (selectedAlgorithm.current) {
      case "bfs": {
        animateBFS(isAnimationEnded ? 0 : animationFrame.current);
        break;
      }
      case "dfs": {
        animateDFS(isAnimationEnded ? 0 : animationFrame.current);
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

  const stepForward = () => {
    pauseAnimation();
    if (!manualSwitch) {
      setManualSwitch(true);
    }
    animationFrame.current = animationFrame.current >= animationFrames.current.length - 1 ? 0 : animationFrame.current + 1;
    setTooltipContent(`${stepByStepExplanation[animationFrame.current]}${animationFrame.current + 1 >= animationFrames.current.length ? "\n\n" + resultText : ""}`);
    switch (selectedAlgorithm.current) {
      case "bfs": {
        animateBFS(animationFrame.current, true);
        break;
      }
      case "dfs": {
        animateDFS(animationFrame.current, true);
        break;
      }
    }
  }

  const stepBack = () => {
    pauseAnimation();
    if (!manualSwitch) {
      setManualSwitch(true);
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
    }
    animationFrame.current = animationFrame.current === 0 ? animationFrames.current.length - 1 : animationFrame.current - 1;
    setTooltipContent(`${stepByStepExplanation[animationFrame.current]}${animationFrame.current + 1 >= animationFrames.current.length ? "\n\n" + resultText : ""}`);
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
        }
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
