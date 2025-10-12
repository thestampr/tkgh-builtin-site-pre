"use client";

import "@/lib/mdconfig";
import clsx from "clsx";
import DOMPurify from "dompurify";
import { MdPreview, type MdPreviewProps } from "md-editor-rt";
import { useLocale } from "next-intl";
import React from "react";

interface Props {
  content: string;
  className?: string;
  theme?: "light" | "dark";
  locale?: string;
}

const MarkdownViewer: React.FC<Props & MdPreviewProps> = ({
  content,
  className,
  theme,
  locale,
  ...props
}) => {
  locale ??= useLocale();

  return (
    <div data-color-mode={theme || "light"}>
      <MdPreview
        className={clsx(
          "prose prose-slate max-w-screen **:!flex-wrap",
          className
        )}
        value={content}
        language={locale}
        previewTheme="github"
        codeTheme="github"
        sanitize={DOMPurify.sanitize}
        noImgZoomIn
        {...props}
      />
    </div>
  );
};

export default MarkdownViewer;