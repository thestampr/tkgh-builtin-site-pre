"use client"

import { useEffect } from "react";

interface MarkdownPreviewProps {
  source: string;
}

export default function MarkdownPreview(props: MarkdownPreviewProps & React.HTMLProps<HTMLDivElement>) {
  useEffect(() => {
    // Client-side effect to handle any necessary updates
  }, [props.source]);

  return <div dangerouslySetInnerHTML={{ __html: props.source }} {...props} />;
}