import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from "axios";
import cytoscape, { Core, Position, Stylesheet, EventObject, EdgeSingular, NodeSingular, ElementDefinition } from 'cytoscape';
import { useGraphEditor } from "@/contexts/GraphEditorContext";
import { useEdgeConfigurator } from '@/contexts/EdgeConfiguratorContext';
import ZoomSlider from "./ZoomSlider";
import Toolbar from "./Toolbar";
import Tooltip from './Tooltip';
import NodeContextMenu from './NodeContextMenu';
import EdgeContextMenu from './EdgeContextMenu';
import AnimationToolbar from './AnimationToolbar';

const CytoscapeComponent: React.FC = () => {
  const { cyRef, getThemeStyles, saveGraph, saveState, checked, showGrid, tooltipContent, setTooltipContent, addNodeMode, addEdgeMode, deleteMode, algorithmMode, selectedAlgorithm, isAnimationReady, startAnimation, setAlgorithmDetails, setStepByStepExplanation, setResultText } = useGraphEditor();
  const { openEdgeConfigurator } = useEdgeConfigurator();
  const [isCyReady, setIsCyReady] = useState(false);
  const [sourceNode, setSourceNode] = useState("");
  const [nodeContextMenuPosition, setNodeContextMenuPosition] = useState<{ x: number; y: number; } | null>(null);
  const [edgeContextMenuPosition, setEdgeContextMenuPosition] = useState<{ x: number; y: number; } | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [graphState, setGraphState] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const nodeCounter = useRef<number>(1);

  useEffect(() => {
    nodeCounter.current = 1;
    
    cyRef.current = cytoscape({
      container: document.getElementById('cy'),
      elements: [
        /*{
          data: { id: 'a', title: "Полить цветы" },
        },
        {
          data: { id: 'b', title: "Вынести мусор" },
        },
        { 
          data: { id: 'a-b', source: 'a', target: 'b', title: "", weight: 5, displayedWeight: "5" }
        }*/
      ],
      style: [],
      layout: {
        name: 'grid',
        padding: 128,
      },
      minZoom: 0.4,
      maxZoom: 6.4,
    });

    const loadGraph = (cy: cytoscape.Core) => {
      const savedGraph = localStorage.getItem('userGraph');
      if (savedGraph) {
        const graphData = JSON.parse(savedGraph);
        cy.json(graphData);
      }
    };
    
    loadGraph(cyRef.current);

    setIsCyReady(true);

    const updateStyles = (theme: string) => {
      const styles = getThemeStyles(theme);
      cyRef.current!.style(styles);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          updateStyles(newTheme!);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    const currentTheme = document.documentElement.getAttribute('data-theme');
    updateStyles(currentTheme!);

    cyRef.current.zoom(1.6);
    updateGridBackground(cyRef.current.pan(), cyRef.current.zoom());

    const resizeCy = () => {
      const container = document.getElementById('cy');
      container!.style.height = `${window.innerHeight}px`;
      cyRef.current!.resize();
    };
    
    cyRef.current.on('pan', () => updateGridBackground(cyRef.current!.pan(), cyRef.current!.zoom()));
    cyRef.current.on('zoom', () => updateGridBackground(cyRef.current!.pan(), cyRef.current!.zoom()));

    window.addEventListener('resize', resizeCy);
  
    return () => {
      window.removeEventListener('resize', resizeCy);
      observer.disconnect();
      cyRef.current?.removeAllListeners();
      cyRef.current?.destroy();
    }
  }, [cyRef, getThemeStyles]);

  const getMaxNodeId = useCallback(() => {
    let maxId = 0;
    cyRef.current!.nodes().each(node => {
      const nodeId = parseInt(node.id());
      if (nodeId > maxId) {
        maxId = nodeId;
      }
    });
    return maxId;
  }, [cyRef]);

  const unselectNodes = useCallback(() => {
    cyRef.current!.elements(".selected").removeClass("selected");
  }, [cyRef])

  useEffect(() => {
    const handleClick = (event: EventObject) => {
      if (addNodeMode && event.target === cyRef.current) {
        const nodeId = `${getMaxNodeId() + 1}`;
        const pos = event.position;

        saveState();

        cyRef.current!.add({
          group: 'nodes',
          data: { id: nodeId, title: nodeId },
          position: {
            x: pos.x,
            y: pos.y
          }
        });

        saveGraph();
      }
      else if (addEdgeMode && event.target === cyRef.current) {
        unselectNodes();
        setSourceNode("");
      }
    };

    const handleNodeSelect = (event: EventObject) => {
      if (addEdgeMode) {
        const nodeId = event.target.id();
        
        if (!sourceNode) {
          setSourceNode(nodeId);
          event.target.addClass("selected");
        } else {
          const edgeId = `${sourceNode}-${nodeId}`;
          const edge = cyRef.current!.getElementById(edgeId);
          const reverseEdgeId = `${nodeId}-${sourceNode}`;
          const reverseEdge = cyRef.current!.getElementById(reverseEdgeId);
          /*if (edge.length > 0 && edge.is("edge")) {
            openEdgeConfigurator("edit", cyRef.current!, sourceNode, nodeId, reverseEdge, edge.data("title"), edge.data("weight"), edge.data("displayedWeight"), edge.hasClass("oriented"));
          } else {
            if (reverseEdge.length > 0 && reverseEdge.is("edge")) {
              if (reverseEdge.hasClass("oriented")) {
                openEdgeConfigurator("create", cyRef.current!, sourceNode, nodeId, reverseEdge);
              } else {
                openEdgeConfigurator("replace", cyRef.current!, sourceNode, nodeId, reverseEdge, reverseEdge.data("title"), reverseEdge.data("weight"), reverseEdge.data("displayedWeight"), false);
              }
            } else {
              openEdgeConfigurator("create", cyRef.current!, sourceNode, nodeId);
            }
          }*/
          if (edge.length > 0 && edge.is("edge")) {
            openEdgeConfigurator("edit", cyRef.current!, sourceNode, nodeId, undefined, edge.data("title"), edge.data("weight"), edge.data("displayedWeight"), edge.hasClass("oriented"));
          } else {
            if (reverseEdge.length > 0 && reverseEdge.is("edge")) {
              openEdgeConfigurator("replace", cyRef.current!, sourceNode, nodeId, reverseEdge, reverseEdge.data("title"), reverseEdge.data("weight"), reverseEdge.data("displayedWeight"), false);
            } else {
              openEdgeConfigurator("create", cyRef.current!, sourceNode, nodeId);
            }
          }
          unselectNodes();
          setSourceNode("");
        }
      } else if (algorithmMode) {
        if (!isAnimationReady) {
          switch (selectedAlgorithm.current) {
            case "bfs": {
              const graph = cyRef.current!.json();
              const startNodeId = event.target.id();
              setIsLoading(true);
              axios.post("/api/bfs", { graph: graph, startNodeId: startNodeId})
                .then(response => {
                  const { frames, shortResultText, resultText, stepByStepExplanation } = response.data;
                  setTimeout(() => {
                    setIsLoading(false);
                    setTooltipContent(shortResultText);
                    setResultText(shortResultText);
                    setAlgorithmDetails(resultText);
                    setStepByStepExplanation(stepByStepExplanation);
                    startAnimation(frames);
                  }, 1000);
                })
                .catch(error => {
                  setIsLoading(false);
                  console.error('Ошибка запроса:', error);
                })
              break;
            }
          }
        }
      }
    };

    const handleElementClick = (event: EventObject) => {
      if (deleteMode) {
        saveState();
        event.target.remove();
        saveGraph();
      }
    };

    const handleNodeRightClick = (event: EventObject) => {
      if (!algorithmMode) {
        const node = event.target;
        const renderedPos = event.renderedPosition;
        const containerOffset = document.getElementById('cy')!.getBoundingClientRect();
  
        const pageX = renderedPos.x + containerOffset.left;
        const pageY = renderedPos.y + containerOffset.top;
  
        setNodeContextMenuPosition({ x: pageX, y: pageY });
        setSelectedNode(node);
      }
    }

    const handleEdgeRightClick = (event: EventObject) => {
      if (!algorithmMode) {
        const edge = event.target;
        const renderedPos = event.renderedPosition;
        const containerOffset = document.getElementById('cy')!.getBoundingClientRect();

        const pageX = renderedPos.x + containerOffset.left;
        const pageY = renderedPos.y + containerOffset.top;

        setEdgeContextMenuPosition({ x: pageX, y: pageY });
        setSelectedEdge(edge);
      }
    }

    const handleNodeGrab = (event: EventObject) => {
      const node = event.target as NodeSingular;
      setGraphState(cyRef.current!.json());
      const position = node.position();
      setInitialPosition({ x: position.x, y: position.y });
    }

    const handleNodeFree = (event: EventObject) => {
      const node = event.target as NodeSingular;
      const newPosition = node.position();
      if (newPosition.x !== initialPosition.x && newPosition.y !== initialPosition.y) {
        saveState(graphState);
        saveGraph();
      }
    }

    cyRef.current!.on('tap', handleClick);
    cyRef.current!.on('tap', 'node', handleNodeSelect);
    cyRef.current!.on('tap', 'node, edge', handleElementClick);
    cyRef.current!.on('cxttap', 'node', handleNodeRightClick);
    cyRef.current!.on('cxttap', 'edge', handleEdgeRightClick);
    cyRef.current!.on('grab', 'node', handleNodeGrab);
    cyRef.current!.on('free', 'node', handleNodeFree);

    return () => {
      cyRef.current?.removeListener('tap', handleClick);
      cyRef.current?.removeListener('tap', 'node', handleNodeSelect);
      cyRef.current?.removeListener('tap', 'node, edge', handleElementClick);
      cyRef.current?.removeListener('cxttap', 'node', handleNodeRightClick);
      cyRef.current?.removeListener('cxttap', 'edge', handleEdgeRightClick);
      cyRef.current?.removeListener('grab', 'node', handleNodeGrab);
      cyRef.current?.removeListener('free', 'node', handleNodeFree);
    }
  }, [cyRef, saveGraph, saveState, getMaxNodeId, unselectNodes, addNodeMode, addEdgeMode, deleteMode, sourceNode, openEdgeConfigurator, initialPosition, graphState, algorithmMode, selectedAlgorithm, setTooltipContent, startAnimation, setAlgorithmDetails, setStepByStepExplanation, setResultText, isAnimationReady])

  useEffect(() => {
    if (!addEdgeMode) {
      unselectNodes();
      setSourceNode("");
    }
  }, [addEdgeMode, unselectNodes]);

  const updateGridBackground = (pan: Position, zoomLevel: number) => {
    const gridSize = 20 * zoomLevel;
    const posX = pan.x % gridSize;
    const posY = pan.y % gridSize;
    document.getElementById('cy')!.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    document.getElementById('cy')!.style.backgroundPosition = `${posX}px ${posY}px`;
  };

  const handleCloseNodeContextMenu = () => {
    setNodeContextMenuPosition(null);
  };

  const handleCloseEdgeContextMenu = () => {
    setEdgeContextMenuPosition(null);
  };

  return (
    <>
      <div id="cy" className={`w-full h-full ${showGrid ? "grid-background" : ""} overflow-hidden ${checked ? "" : "absolute top-0 left-0"}`} />
      {isCyReady && <ZoomSlider />}
      <Toolbar />
      <Tooltip content={tooltipContent} isLoading={isLoading} />
      <NodeContextMenu position={nodeContextMenuPosition} node={selectedNode} close={handleCloseNodeContextMenu} />
      <EdgeContextMenu position={edgeContextMenuPosition} edge={selectedEdge} close={handleCloseEdgeContextMenu} />
      <AnimationToolbar />
    </>
  );
};

export default CytoscapeComponent;
