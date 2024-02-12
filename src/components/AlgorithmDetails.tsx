import React, { useState, useEffect } from "react";
import Markdown from "./Markdown";
import TypeIt from "typeit-react";

interface AlgorithmDetailsProps {
  content: string;
  close: () => void;
}

const AlgorithmDetails: React.FC<AlgorithmDetailsProps> = ({
  content,
  close,
}) => {
  /*const [isLoading, setIsLoading] = useState(true);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => (dots.length < 3 ? dots + "." : "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);*/

  return (
    <dialog id="algorithm-details" className="modal">
      <div className="modal-box max-w-2xl prose prose-headings:mt-2 text-sm">
        <form method="dialog">
          <button className="btn btn-sm btn-ghost w-8 h-8 no-animation text-base-content text-opacity-50 hover:bg-transparent hover:text-opacity-100 absolute right-2 top-2">
            ✕
          </button>
        </form>
        <TypeIt
          key={content}
          options={{
            cursor: false,
            speed: 8,
            lifeLike: true,
            startDelay: 0,
          }}
        >
          <Markdown markdown={content} className="mt-5 mb-4 max-h-[70vh] overflow-y-auto" />
        </TypeIt>
        {/*isLoading ? (
          <div className="flex flex-col gap-2 items-center justify-center py-32">
            <span className="loading loading-dots loading-xs text-base-content"></span>
            <p className="text-base-content text-sm my-0">Пожалуйста, подождите{dots}</p>
          </div>
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
            >
              <Markdown markdown={content} />
            </TypeIt>
          </>
            )*/}
        <div className="flex w-full justify-end gap-2">
          <button
            onClick={close}
            className="btn no-animation bg-base-200 hover:bg-base-300 hover:border-base-300"
          >
            Закрыть
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default AlgorithmDetails;
