import { motion, AnimatePresence } from "framer-motion";
import React, { useRef } from "react";
import { useGraphEditor } from "@/contexts/GraphEditorContext";
import Markdown from "./Markdown";
import { FaAngleLeft, FaPlay } from "react-icons/fa6";
import TypeIt from "typeit-react";
import AlgorithmDetails from "./AlgorithmDetails";

interface TooltipProps {
  content: string;
  isLoading: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, isLoading }) => {
  const {
    checked,
    algorithmMode,
    disableAlgorithmMode,
    isAnimationReady,
    algorithmDetails,
    isJustStartAlgorithm,
    startAlgorithm,
  } = useGraphEditor();

  const openAlgorithmDetails = () => {
    const algorithmDetailsModal = document.getElementById("algorithm-details");
    if (algorithmDetailsModal instanceof HTMLDialogElement) {
      algorithmDetailsModal.showModal();
    }
  };

  const closeAlgorithmDetails = () => {
    const algorithmDetailsModal = document.getElementById("algorithm-details");
    if (algorithmDetailsModal instanceof HTMLDialogElement) {
      algorithmDetailsModal.close();
    }
  };

  return (
    <>
      <AnimatePresence>
        {content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-8 text-xs font-bold flex justify-center z-10 ${
              checked ? "" : "left-0 w-full"
            }`}
          >
            <div className="alert prose prose-p:my-0 flex flex-col items-center gap-0 max-w-xl text-center text-xs bg-base-200 border-none bg-opacity-50 backdrop-blur">
              {isLoading ? (
                <span className="loading loading-dots loading-xs text-base-content"></span>
              ) : (
                <>
                  <TypeIt
                    key={content}
                    options={{
                      cursor: false,
                      speed: 24,
                      lifeLike: true,
                      startDelay: 0,
                    }}
                    className="max-h-32 overflow-y-auto"
                  >
                    <Markdown
                      markdown={content}
                      className="flex flex-col gap-1"
                    />
                  </TypeIt>
                  {isJustStartAlgorithm && (
                    <button
                    className="btn btn-ghost no-animation mt-1 btn-xs font-bold justify-center items-center gap-1 min-w-max text-base-content text-opacity-75 hover:bg-transparent hover:text-opacity-100"
                    onClick={startAlgorithm}
                  >
                    <FaPlay size={12}></FaPlay>
                    Старт
                  </button>
                  )}
                  {isAnimationReady && (
                    <button
                      className="btn btn-ghost no-animation mt-1 btn-xs font-bold justify-center items-center gap-1 min-w-max text-base-content text-opacity-75 hover:bg-transparent hover:text-opacity-100"
                      onClick={openAlgorithmDetails}
                    >
                      Узнать подробности
                    </button>
                  )}
                </>
              )}
              {algorithmMode && (
                <button
                  className="btn btn-ghost no-animation mt-1 btn-xs font-bold justify-center items-center gap-1 min-w-max text-base-content text-opacity-75 hover:bg-transparent hover:text-opacity-100"
                  onClick={disableAlgorithmMode}
                >
                  <FaAngleLeft size={14}></FaAngleLeft>
                  Вернуться в режим редактирования графа
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AlgorithmDetails
        content={algorithmDetails}
        close={closeAlgorithmDetails}
      ></AlgorithmDetails>
    </>
  );
};

export default Tooltip;
