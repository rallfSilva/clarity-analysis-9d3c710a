import { useEffect, useRef, useState } from 'react';

interface IsolatedHtmlReportProps {
  html: string;
  minHeight?: number;
}

export function IsolatedHtmlReport({ html, minHeight = 240 }: IsolatedHtmlReportProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    let ro: ResizeObserver | null = null;

    const updateHeight = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const h = Math.max(minHeight, doc.documentElement.scrollHeight);
        setHeight(h);
      } catch {
        /* cross-origin or detached */
      }
    };

    const onLoad = () => {
      updateHeight();
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          ro = new ResizeObserver(updateHeight);
          ro.observe(doc.documentElement);
        }
      } catch {
        /* ignore */
      }
    };

    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
      ro?.disconnect();
    };
  }, [html, minHeight]);

  return (
    <iframe
      ref={ref}
      title="Relatório"
      srcDoc={html}
      sandbox="allow-same-origin"
      style={{
        width: '100%',
        border: 0,
        display: 'block',
        height: `${height}px`,
      }}
    />
  );
}
