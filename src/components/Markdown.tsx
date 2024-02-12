import React from "react";
import { marked } from "marked";

interface MarkdownProps {
  markdown: string;
  className?: string;
}

const Markdown: React.FC<MarkdownProps> = ({ markdown, className }) => {
  const renderer = new marked.Renderer();

  renderer.link = (href, title, text) => {
    return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${
      title || ""
    }">${text}</a>`;
  };

  const getMarkdownText = () => {
    const rawMarkup = marked(markdown, { renderer });
    return { __html: rawMarkup };
  };

  return <div dangerouslySetInnerHTML={getMarkdownText()} className={className} />;
};

export default Markdown;
