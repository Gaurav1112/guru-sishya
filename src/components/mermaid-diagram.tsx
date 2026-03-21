"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#e8521a",
            primaryTextColor: "#faf7f0",
            primaryBorderColor: "#e8521a",
            lineColor: "#6b7dba",
            secondaryColor: "#1e1f3b",
            tertiaryColor: "#141526",
            background: "#141526",
            mainBkg: "#1e1f3b",
            nodeBorder: "#2e3050",
            clusterBkg: "#1e1f3b",
            titleColor: "#faf7f0",
            edgeLabelBackground: "#1e1f3b",
          },
        });

        // mermaid.render requires a unique id each call
        const renderId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, chart.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRendered(true);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    // Fallback: show raw code block
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs font-mono text-muted-foreground">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-x-auto rounded-lg border border-border bg-surface p-4 [&_svg]:max-w-full [&_svg]:mx-auto [&_svg]:block"
      aria-label="Mermaid diagram"
    >
      {!rendered && (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
          Rendering diagram…
        </div>
      )}
    </div>
  );
}
