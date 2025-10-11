"use client";

import type { MDEditorProps } from '@uiw/react-md-editor';
import MDEditor from '@uiw/react-md-editor';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import React from "react";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";

interface Props {
  theme?: "light" | "dark";
  className?: string;
  value?: string;
  preview?: MDEditorProps['preview'];
  height?: number;
  onChange?: MDEditorProps['onChange'];
}

const MarkdownEditor: React.FC<Props> = ({ 
  className,
  theme,
  value,
  onChange = () => {},
  preview = "edit",
  height = 500
}) => {
  const localeCode = useTranslations("Locale")("code");

  return (
    <div data-color-mode={theme || "light"}>
      <MDEditor
        className={clsx(
          "prose prose-slate max-w-none", 
          className
        )}
        value={value}
        onChange={onChange}
        height={height}
        lang={localeCode}
        preview={preview}
        previewOptions={{
          remarkPlugins: [[remarkGfm]],
          rehypePlugins: [[remarkRehype, rehypeSanitize]],
        }}
      />
    </div>
  );
};

export default MarkdownEditor;