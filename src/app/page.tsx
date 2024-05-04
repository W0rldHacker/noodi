"use client";

import { useState, useEffect } from "react";
import { FaChevronLeft, FaGithub, FaRegCircleQuestion } from "react-icons/fa6";
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";
import { useGraphEditor } from "@/contexts/GraphEditorContext";
import CytoscapeComponent from "@/components/CytoscapeComponent";
import { EdgeConfiguratorProvider } from "@/contexts/EdgeConfiguratorContext";

export default function Home() {
  const { checked, setChecked, enableAlgorithmMode, selectedAlgorithm } = useGraphEditor();
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="drawer overflow-hidden">
      <input
        id="drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      <div className="drawer-content flex flex-col items-center justify-center">
        <EdgeConfiguratorProvider>
          <CytoscapeComponent />
        </EdgeConfiguratorProvider>
        <div
          className={`tooltip tooltip-right before:text-xs before:p-2 absolute left-0 ${
            checked ? "translate-x-72" : ""
          } transition-transform duration-300`}
          data-tip={(checked ? "Скрыть" : "Показать") + " боковую панель"}
        >
          <label
            htmlFor="drawer"
            className={`btn btn-ghost p-2 min-h-min h-auto no-animation text-base-content text-opacity-50 hover:bg-transparent hover:text-opacity-100 ${
              checked ? "" : "rotate-180"
            } transition-all duration-300`}
          >
            <FaChevronLeft size={20} />
          </label>
        </div>
      </div>
      <div className="drawer-side w-72 relative overflow-x-hidden overflow-y-hidden hover:overflow-y-auto z-10">
        <ul className="menu p-4 pr-6 w-72 min-h-full bg-base-200 text-base-content">
          <li className="w-full flex items-center justify-center">
            <svg
              id="_Слой_1"
              data-name="Слой 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100.32 25.5"
              className="menu-title w-40 fill-base-content"
            >
              <g>
                <path d="m1.63,25.02c-.47,0-.86-.16-1.17-.46-.31-.31-.46-.7-.46-1.17v-14.27c0-.49.15-.88.46-1.18.31-.3.7-.45,1.17-.45s.88.15,1.18.45c.3.3.45.69.45,1.18v14.27c0,.47-.15.86-.45,1.17-.3.31-.69.46-1.18.46Zm13.15,0c-.47,0-.86-.16-1.17-.46-.31-.31-.46-.7-.46-1.17v-7.87c0-1.22-.22-2.21-.67-2.98-.45-.77-1.05-1.34-1.81-1.71-.76-.37-1.63-.56-2.61-.56-.9,0-1.71.18-2.43.54-.73.36-1.3.85-1.73,1.46-.43.61-.64,1.31-.64,2.1H1.25c0-1.34.33-2.54.98-3.6.65-1.06,1.54-1.89,2.67-2.51s2.4-.93,3.81-.93,2.79.31,3.95.94c1.16.63,2.08,1.55,2.75,2.77.67,1.22,1.01,2.71,1.01,4.48v7.87c0,.47-.15.86-.46,1.17-.31.31-.7.46-1.17.46Z" />
                <path d="m29.76,25.12c-1.73,0-3.25-.38-4.58-1.14-1.32-.76-2.36-1.8-3.12-3.14-.76-1.33-1.14-2.86-1.14-4.59s.38-3.29,1.14-4.62c.76-1.33,1.8-2.38,3.12-3.14,1.32-.76,2.85-1.14,4.58-1.14s3.22.38,4.54,1.14c1.32.76,2.36,1.8,3.12,3.14.76,1.33,1.14,2.87,1.14,4.62s-.37,3.26-1.12,4.59c-.75,1.33-1.78,2.38-3.1,3.14-1.32.76-2.85,1.14-4.58,1.14Zm0-2.88c1.11,0,2.09-.26,2.94-.77.85-.51,1.52-1.22,2-2.11.48-.9.72-1.93.72-3.1s-.24-2.21-.72-3.12c-.48-.91-1.15-1.62-2-2.13-.85-.51-1.83-.77-2.94-.77s-2.09.26-2.94.77c-.85.51-1.53,1.22-2.02,2.13s-.74,1.95-.74,3.12.25,2.21.74,3.1c.49.9,1.16,1.6,2.02,2.11.85.51,1.83.77,2.94.77Z" />
                <path d="m51.36,25.12c-1.73,0-3.25-.38-4.58-1.14-1.32-.76-2.36-1.8-3.12-3.14-.76-1.33-1.14-2.86-1.14-4.59s.38-3.29,1.14-4.62c.76-1.33,1.8-2.38,3.12-3.14,1.32-.76,2.85-1.14,4.58-1.14s3.22.38,4.54,1.14c1.32.76,2.36,1.8,3.12,3.14.76,1.33,1.14,2.87,1.14,4.62s-.37,3.26-1.12,4.59c-.75,1.33-1.78,2.38-3.1,3.14-1.32.76-2.85,1.14-4.58,1.14Zm0-2.88c1.11,0,2.09-.26,2.94-.77.85-.51,1.52-1.22,2-2.11.48-.9.72-1.93.72-3.1s-.24-2.21-.72-3.12c-.48-.91-1.15-1.62-2-2.13-.85-.51-1.83-.77-2.94-.77s-2.09.26-2.94.77c-.85.51-1.53,1.22-2.02,2.13s-.74,1.95-.74,3.12.25,2.21.74,3.1c.49.9,1.16,1.6,2.02,2.11.85.51,1.83.77,2.94.77Z" />
                <path d="m72.96,25.12c-1.66,0-3.16-.39-4.5-1.17-1.33-.78-2.39-1.84-3.17-3.18-.78-1.34-1.17-2.86-1.17-4.54s.36-3.19,1.07-4.53c.71-1.33,1.69-2.39,2.93-3.17,1.24-.78,2.63-1.17,4.19-1.17,1.26,0,2.42.26,3.49.78,1.07.52,1.96,1.23,2.69,2.13V1.63c0-.49.15-.89.46-1.18.31-.3.7-.45,1.17-.45s.89.15,1.18.45c.3.3.45.69.45,1.18v14.59c0,1.69-.39,3.2-1.17,4.54-.78,1.34-1.83,2.41-3.15,3.18s-2.82,1.17-4.48,1.17Zm0-2.88c1.09,0,2.06-.26,2.91-.78s1.53-1.24,2.02-2.16c.49-.92.74-1.94.74-3.07s-.25-2.18-.74-3.07c-.49-.9-1.16-1.6-2.02-2.13s-1.82-.78-2.91-.78-2.03.26-2.9.78-1.55,1.23-2.05,2.13c-.5.9-.75,1.92-.75,3.07s.25,2.16.75,3.07c.5.92,1.18,1.64,2.05,2.16s1.83.78,2.9.78Z" />
                <path d="m89.47,4.64c-.58,0-1.07-.21-1.49-.62-.42-.42-.62-.91-.62-1.49s.21-1.07.62-1.49c.42-.42.91-.62,1.49-.62s1.07.21,1.49.62.62.91.62,1.49-.21,1.07-.62,1.49-.91.62-1.49.62Zm0,20.35c-.47,0-.86-.15-1.17-.46-.31-.31-.46-.7-.46-1.17v-14.24c0-.49.15-.88.46-1.18.31-.3.7-.45,1.17-.45s.88.15,1.18.45c.3.3.45.69.45,1.18v14.24c0,.47-.15.86-.45,1.17-.3.31-.69.46-1.18.46Z" />
                <path d="m98.11,25.5c-.6,0-1.12-.22-1.55-.66-.44-.44-.66-.95-.66-1.55s.22-1.15.66-1.58c.44-.44.96-.66,1.55-.66s1.14.22,1.57.66c.43.44.64.97.64,1.58s-.21,1.12-.64,1.55c-.43.44-.95.66-1.57.66Z" />
              </g>
              <line
                x1="36.52"
                y1="16.5"
                x2="43.97"
                y2="16.5"
                fill="none"
                className="stroke-base-content"
                strokeMiterlimit="10"
                strokeWidth="3"
              />
              <line
                x1="58.58"
                y1="16.5"
                x2="65.16"
                y2="16.5"
                fill="none"
                className="stroke-base-content"
                strokeMiterlimit="10"
                strokeWidth="3"
              />
            </svg>
            <p className="menu-title pt-0">version {process.env.NEXT_PUBLIC_APP_VERSION}</p>
          </li>
          <li className="">
            <ul className="menu m-0 p-0 my-2 flex-row gap-2 justify-center before:bg-transparent">
              <li>
                <a className="menu-btn tooltip before:bg-transparent before:text-xs before:-mb-2.5 before:duration-0 after:hidden" data-tip="Сменить тему">
                  <label className="swap swap-rotate h-9 w-9 rounded-lg">
                    <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
                    <MdOutlineDarkMode size={24} className="swap-on"></MdOutlineDarkMode>
                    <MdOutlineLightMode size={24} className="swap-off"></MdOutlineLightMode>
                  </label>
                </a>
              </li>
              <li>
                <a className="menu-btn tooltip before:bg-transparent before:text-xs before:-mb-2.5 before:duration-0 after:hidden" data-tip="GitHub">
                  <FaGithub size={20}></FaGithub>
                </a>
              </li>
              <li>
                <a className="menu-btn tooltip before:bg-transparent before:text-xs before:-mb-2.5 before:duration-0 after:hidden" data-tip="Помощь">
                  <FaRegCircleQuestion size={20}></FaRegCircleQuestion>
                </a>
              </li>
            </ul>
          </li>
          <li className="text-xs">
            <p className="menu-title text-base-content text-xs">Список алгоритмов</p>
            <details open>
              <summary>Поиск путей и обход графа</summary>
              <ul className="flex flex-col gap-y-0.5 mt-0.5">
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "bfs" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("bfs")}>
                      Поиск в ширину
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "dfs" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("dfs")}>
                      Поиск в глубину
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "dijkstra" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("dijkstra")}>
                      Алгоритм Дейкстры
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "bellmanFord" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("bellmanFord")}>
                      Алгоритм Беллмана-Форда
                    </button>
                  </a>
                </li>
                <li><a>Алгоритм Флойда</a></li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "topologicalSort" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("topologicalSort")}>
                      Топологическая сортировка
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "findWeaklyConnectedComponents" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("findWeaklyConnectedComponents")}>
                      Нахождение компонент слабой связности
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "findHamiltonianPath" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("findHamiltonianPath")}>
                      Поиск гамильтонова пути
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "findHamiltonianCycle" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("findHamiltonianCycle")}>
                      Поиск гамильтонова цикла
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "findEulerianPath" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("findEulerianPath")}>
                      Поиск эйлерова пути
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "findEulerianCycle" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("findEulerianCycle")}>
                      Поиск эйлерова цикла
                    </button>
                  </a>
                </li>
              </ul>
            </details>
            <details open>
              <summary>Задачи минимального остовного дерева и сетевого потока</summary>
              <ul className="flex flex-col gap-y-0.5 mt-0.5">
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "prim" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("prim")}>
                      Алгоритм Прима
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "kruskal" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("kruskal")}>
                      Алгоритм Крускала
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "edmondsKarp" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("edmondsKarp")}>
                      Алгоритм Эдмондса-Карпа
                    </button>
                  </a>
                </li>
              </ul>
            </details>
            <details open>
              <summary>Специализированные алгоритмы</summary>
              <ul className="flex flex-col gap-y-0.5 mt-0.5">
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "tarjan" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("tarjan")}>
                      Алгоритм Тарьяна
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "graphColoring" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("graphColoring")}>
                      Цветовая раскраска
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "findGraphProperties" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("findGraphProperties")}>
                      Нахождение радиуса и диаметра
                    </button>
                  </a>
                </li>
                <li>
                  <a className={`block p-0 ${selectedAlgorithm.current === "calculateDegrees" ? "algorithm-button-checked" : ""}`}>
                    <button className={`px-4 py-2 w-full h-full text-left rounded-md `} onClick={() => enableAlgorithmMode("calculateDegrees")}>
                      Вычисление степеней вершин
                    </button>
                  </a>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  );
}
