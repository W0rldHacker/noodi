import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaBackward,
  FaForward,
  FaRepeat,
  FaBorderAll,
  FaAngleLeft,
} from "react-icons/fa6";
import { useGraphEditor } from "@/contexts/GraphEditorContext";

const AnimationToolbar: React.FC = () => {
  //const speedMultipliers = [0.5, 1, 1.5, 2, 3];
  const {
    checked,
    showGrid,
    toggleGrid,
    algorithmMode,
    isAnimationReady,
    isPlaying,
    animationSpeed,
    loopedMode,
    toggleLoopedMode,
    increaseMultiplier,
    decreaseMultiplier,
    playAnimation,
    pauseAnimation,
    stopAnimation,
    stepForward,
    stepBack,
  } = useGraphEditor();
  const [currentSpeed, setCurrentSpeed] = useState(animationSpeed.current);
  //const [isPlaying, setIsPlaying] = useState(isAnimationPlaying.current);
  const [looped, setLooped] = useState(loopedMode.current);

  /*const pause = useCallback(() => {
    pauseAnimation();
    setIsPlaying(false);
  }, [pauseAnimation]);

  const play = useCallback(() => {
    playAnimation();
    setIsPlaying(true);
  }, [playAnimation]);

  const stop = useCallback(() => {
    stopAnimation(false);
    setIsPlaying(false);
  }, [stopAnimation]);

  const forward = useCallback(() => {
    pause();
    stepForward();
  }, [pause, stepForward]);

  const back = useCallback(() => {
    pause();
    stepBack();
  }, [pause, stepBack]);*/

  const toggleLooped = useCallback(() => {
    toggleLoopedMode();
    setLooped(loopedMode.current);
  }, [loopedMode, toggleLoopedMode]);

  const speedUp = useCallback(() => {
    increaseMultiplier();
    setCurrentSpeed(animationSpeed.current);
  }, [increaseMultiplier, animationSpeed]);

  const slowDown = useCallback(() => {
    decreaseMultiplier();
    setCurrentSpeed(animationSpeed.current);
  }, [decreaseMultiplier, animationSpeed]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === "g" || event.key === "п")) {
        event.preventDefault();
        toggleGrid();
      } else if (isAnimationReady && event.ctrlKey && (event.key === "p" || event.key === "з")) {
        event.preventDefault();
        if (isPlaying) {
          pauseAnimation();
        } else {
          playAnimation();
        }
      } else if (isAnimationReady && event.ctrlKey && (event.key === "s" || event.key === "ы")) {
        event.preventDefault();
        stopAnimation(false);
      } else if (algorithmMode && event.ctrlKey && (event.key === "r" || event.key === "к")) {
        event.preventDefault();
        toggleLooped();
      } else if (isAnimationReady && event.key === "ArrowLeft") {
        event.preventDefault();
        stepBack();
      } else if (isAnimationReady && event.key === "ArrowRight") {
        event.preventDefault();
        stepForward();
      } else if (algorithmMode && event.key === "ArrowUp") {
        event.preventDefault();
        speedUp();
      } else if (algorithmMode && event.key === "ArrowDown") {
        event.preventDefault();
        slowDown();
      }
    };

    window.addEventListener("keydown", handleHotkey);

    return () => {
      window.removeEventListener("keydown", handleHotkey);
    };
  }, [toggleGrid, isPlaying, isAnimationReady, playAnimation, pauseAnimation, stopAnimation, stepForward, stepBack, algorithmMode, speedUp, slowDown, toggleLooped]);

  const handleLeftClick = (e: React.MouseEvent) => {
    e.preventDefault();
    speedUp();
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    slowDown();
  };

  return (
    <AnimatePresence>
      {algorithmMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
          transition={{ delay: 0.15, duration: 0.15 }}
          className={`absolute bottom-16 flex justify-center z-10 ${
            checked ? "" : "left-0 w-full"
          }`}
        >
          {/*<button className="btn btn-ghost btn-xs absolute -top-8 font-bold justify-center items-center gap-1 min-w-max text-base-content text-opacity-75 hover:bg-transparent hover:text-opacity-100">
        <FaAngleLeft size={14}></FaAngleLeft>
        Вернуться в режим редактирования графа
  </button>*/}
          <ul className="menu menu-horizontal items-center bg-base-content text-base-200 bg-opacity-50 backdrop-blur rounded-box">
            <li>
              <a
                className={`tooltip h-9 w-9 flex items-center justify-center duration-0 before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip={`${isPlaying ? "Пауза" : "Воспроизвести"} (Ctrl + P)`}
              >
                {isPlaying ? (
                  <button
                    className={`p-2 rounded-lg transition-all duration-150 ${
                      isAnimationReady ? "" : "button-disabled"
                    }`}
                    onClick={pauseAnimation}
                  >
                    <FaPause size={20} />
                  </button>
                ) : (
                  <button
                    className={`p-2 rounded-lg transition-all duration-150 ${
                      isAnimationReady ? "" : "button-disabled"
                    }`}
                    onClick={playAnimation}
                  >
                    <FaPlay size={20} />
                  </button>
                )}
              </a>
            </li>
            <div className="noodi-divider" />
            <li>
              <a
                className={`tooltip h-9 w-9 flex items-center justify-center duration-0 before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip="Стоп (Ctrl + S)"
              >
                <button
                  className={`p-2 rounded-lg transition-all duration-150 ${
                    isAnimationReady ? "" : "button-disabled"
                  }`}
                  onClick={() => stopAnimation(false)}
                >
                  <FaStop size={22} />
                </button>
              </a>
            </li>
            <div className="noodi-divider" />
            <li>
              <a
                className={`tooltip h-9 w-9 flex items-center justify-center duration-0 icon-md before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip="Назад на 1 шаг (🠔)"
              >
                <button
                  className={`p-2 rounded-lg transition-all duration-150 ${
                    isAnimationReady ? "" : "button-disabled"
                  }`}
                  onClick={stepBack}
                >
                  <FaBackward size={20} />
                </button>
              </a>
            </li>
            <div className="noodi-divider" />
            <li>
              <a
                className={`tooltip h-9 w-9 flex items-center justify-center duration-0 before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip="Вперёд на 1 шаг (🠖)"
              >
                <button
                  className={`p-2 rounded-lg transition-all duration-150 ${
                    isAnimationReady ? "" : "button-disabled"
                  }`}
                  onClick={stepForward}
                >
                  <FaForward size={20} />
                </button>
              </a>
            </li>
            <div className="noodi-divider" />
            <li>
              <a
                className={`tooltip long-text-tooltip h-9 w-9 flex items-center justify-center before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip="Скорость воспроизведения (ЛКМ/🠕 - ускорить, ПКМ/🠗 - замедлить)"
              >
                <button
                  className="p-2 rounded-lg pt-2.5 font-bold"
                  onClick={handleLeftClick}
                  onContextMenu={handleRightClick}
                >
                  {currentSpeed}x
                </button>
              </a>
            </li>
            <div className="noodi-divider" />
            <li>
              <a
                className={`tooltip h-9 w-9 flex items-center justify-center ${
                  looped ? "button-checked" : ""
                } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip="Зациклить воспроизведение (Ctrl + R)"
              >
                <button className="p-2 rounded-lg" onClick={toggleLooped}>
                  <FaRepeat size={20} />
                </button>
              </a>
            </li>
            <div className="noodi-divider" />
            <li>
              <a
                className={`tooltip h-9 w-9 flex items-center justify-center ${
                  showGrid ? "button-checked" : ""
                } before:bg-transparent before:text-xs before:mb-2 after:hidden`}
                data-tip="Скрыть/показать сетку (Ctrl + G)"
              >
                <button className="p-2 rounded-lg" onClick={toggleGrid}>
                  <FaBorderAll size={20} />
                </button>
              </a>
            </li>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimationToolbar;
