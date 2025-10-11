"use client";

import type { MarkdownPreviewProps } from '@uiw/react-markdown-preview';
import MDEditor from '@uiw/react-md-editor';
import clsx from 'clsx';
import React from "react";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";

interface Props {
  content: string;
  theme?: "light" | "dark";
  className?: string;
}

const MarkdownViewer: React.FC<Props & MarkdownPreviewProps> = ({ 
  content, 
  className, 
  theme, 
  ...props 
}) => {
  return (
    <div data-color-mode={theme || "light"}>
      <MDEditor.Markdown
        source={content}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[remarkRehype, rehypeSanitize]}
        className={clsx(
          "prose prose-slate max-w-none", 
          className
        )}
        {...props}
      />
    </div>
  );
};

export default MarkdownViewer;