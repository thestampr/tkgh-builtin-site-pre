"use client";

import "@/lib/mdconfig";
import clsx from "clsx";
import DOMPurify from "dompurify";
import type { EditorProps, ExposeParam, ToolbarNames } from "md-editor-rt";
import { MdEditor } from "md-editor-rt";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  value?: string;
  className?: string;
  height?: number;
  theme?: "light" | "dark";
  locale?: string;
  onChange?: EditorProps["onChange"];
}

interface EditorState {
  previewOnly: boolean;
  pageFullscreen: boolean;
}

const navToolbar: ToolbarNames[] = [
  "revoke",
  "next",
];

const textToolbar: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
];

const baseToolbar: ToolbarNames[] = [
  ...navToolbar,
  "-",
  ...textToolbar,
];

const extendedToolbar: ToolbarNames[] = [
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task", // ^2.4.0
];

const utilsToolbar: ToolbarNames[] = [
  "codeRow",
  "code",
  "link",
  "table",
  "mermaid",
  "katex",
];

const extendedUtilsToolbar: ToolbarNames[] = [
  ...extendedToolbar,
  "-",
  ...utilsToolbar
];

const previewActions: ToolbarNames[] = [
  "=",
  "preview",
  "previewOnly",
  "-",
  "pageFullscreen",
];

const mobileToolbar: ToolbarNames[] = [
  ...baseToolbar,
  ...previewActions
];

const tabletToolbar: ToolbarNames[] = [
  ...baseToolbar,
  "-",
  ...extendedToolbar,
  ...previewActions
];

const desktopToolbar: ToolbarNames[] = [
  ...baseToolbar,
  "-",
  ...extendedUtilsToolbar,
  ...previewActions
];

const floatingToolbars: ToolbarNames[] = [
  ...textToolbar,
  "-",
  ...extendedToolbar
];

const MarkdownEditor: React.FC<Props & EditorProps> = ({
  value,
  className,
  height = 500,
  theme,
  locale,
  onChange = () => { },
  preview = "edit",
  ...props
}) => {
  const editorRef = useRef<ExposeParam>(null);
  const [toolbars, setToolbars] = useState<ToolbarNames[]>(mobileToolbar);
  const [editorState, setEditorState] = useState<EditorState>({
    previewOnly: false,
    pageFullscreen: false,
  });
  const [viewportWidth, setViewportWidth] = useState(0);

  locale ??= useLocale();

  const onSizeChange = useCallback(() => {
    setViewportWidth(window.innerWidth);
  }, []);
  useEffect(() => {
    setViewportWidth(window.innerWidth);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", onSizeChange);
    return () => {
      window.removeEventListener("resize", onSizeChange);
    }
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.on("previewOnly", (v: boolean) => {
      setEditorState(s => ({ ...s, previewOnly: v }));
    });
    editorRef.current.on("pageFullscreen", (v: boolean) => {
      setEditorState(s => ({ ...s, pageFullscreen: v }));
    });
  }, []);

  useEffect(() => {
    setToolbars(getToolbarItems());
  }, [editorState, viewportWidth]);

  const getToolbarBaseOnWidth = (w: number) => {
    if (w < 640) {
      return mobileToolbar;
    } else if (w < 1280) {
      return tabletToolbar;
    }
    return desktopToolbar;
  }

  const getToolbarItems = () => {
    if (editorState.previewOnly) {
      return previewActions;
    } else if (editorState.pageFullscreen) {
      return getToolbarBaseOnWidth(viewportWidth);
    }
    return mobileToolbar;
  };

  return (
    <div data-color-mode={theme || "light"}>
      <MdEditor
        ref={editorRef}
        className={clsx(
          "md-editor prose prose-slate max-w-screen",
          editorState.pageFullscreen ? "" : "rounded-lg",
          className
        )}
        value={value}
        onChange={onChange}
        sanitize={DOMPurify.sanitize}
        language={locale}
        toolbars={toolbars}
        floatingToolbars={floatingToolbars}
        previewTheme="github"
        codeTheme="github"
        noImgZoomIn
        noUploadImg
        {...props}
      />
    </div>
  );
};

export default MarkdownEditor;