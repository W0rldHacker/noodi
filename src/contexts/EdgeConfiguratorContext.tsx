"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Core, EdgeSingular } from "cytoscape";
import EdgeConfiguratorModal from "@/components/EdgeConfiguratorModal";

interface EdgeConfiguratorContextProps {
  openEdgeConfigurator: (
    mode: "create" | "edit" | "replace",
    cy: Core,
    sourceId: string,
    targetId: string,
    reverseEdge?: EdgeSingular,
    edgeTitle?: string,
    edgeWeight?: number,
    displayedEdgeWeight?: string,
    isOriented?: boolean
  ) => void;
}

const EdgeConfiguratorContext = createContext<
  EdgeConfiguratorContextProps | undefined
>(undefined);

export const useEdgeConfigurator = () => {
  const context = useContext(EdgeConfiguratorContext);
  if (!context) {
    throw new Error(
      "useEdgeConfigurator должен использоваться внутри EdgeConfiguratorProvider"
    );
  }
  return context;
};

interface EdgeConfiguratorProviderProps {
  children: React.ReactNode;
}

export const EdgeConfiguratorProvider: React.FC<
  EdgeConfiguratorProviderProps
> = ({ children }) => {
  const [edgeConfig, setEdgeConfig] = useState<{
    mode: "create" | "edit" | "replace";
    cy: Core | null,
    sourceId: string | null,
    targetId: string | null,
    reverseEdge: EdgeSingular | null,
    edgeTitle: string;
    edgeWeight: number;
    displayedEdgeWeight: string,
    isOriented: boolean;
  }>({ mode: "create", cy: null, sourceId: null, targetId: null, reverseEdge: null, edgeTitle: "", edgeWeight: 1, displayedEdgeWeight: "", isOriented: true });

  const openEdgeConfigurator = (
    mode: "create" | "edit" | "replace",
    cy: Core,
    sourceId: string,
    targetId: string,
    reverseEdge?: EdgeSingular,
    edgeTitle?: string,
    edgeWeight?: number,
    displayedEdgeWeight?: string,
    isOriented?: boolean
  ) => {
    setEdgeConfig({
      mode: mode,
      cy: cy,
      sourceId: sourceId,
      targetId: targetId,
      reverseEdge: reverseEdge || null,
      edgeTitle: edgeTitle || "",
      edgeWeight: edgeWeight || 1,
      displayedEdgeWeight: displayedEdgeWeight || "",
      isOriented: isOriented === undefined ? true : isOriented,
    });
    const edgeConfigurator = document.getElementById("edge-configurator");
    if (edgeConfigurator instanceof HTMLDialogElement) {
      edgeConfigurator.showModal();
    }
  };

  const closeEdgeConfigurator = () => {
    const edgeConfigurator = document.getElementById("edge-configurator");
    if (edgeConfigurator instanceof HTMLDialogElement) {
      edgeConfigurator.close();
    }
  };

  return (
    <EdgeConfiguratorContext.Provider value={{openEdgeConfigurator}}>
      {children}
      <EdgeConfiguratorModal defaultConfig={edgeConfig} close={closeEdgeConfigurator} />
    </EdgeConfiguratorContext.Provider>
  );
};
