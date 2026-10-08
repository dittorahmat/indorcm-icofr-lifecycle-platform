import * as React from 'react';
import type { ReactFlowInstance } from 'reactflow';

export function useBPMEditorView() {
  const [documentView, setDocumentView] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isOcrDialogOpen, setIsOcrDialogOpen] = React.useState(false);
  const [isRcmImportDialogOpen, setIsRcmImportDialogOpen] = React.useState(false);
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleFitView = React.useCallback(() => {
    if (rfInstance) {
      rfInstance.fitView({ padding: 0.15, duration: 400 });
    }
  }, [rfInstance]);

  const toggleFullscreen = React.useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        // Fallback for browsers / iframes that deny native fullscreen
        setIsFullscreen((prev) => !prev);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Auto refit view after fullscreen resize transition
      setTimeout(() => {
        if (rfInstance) {
          rfInstance.fitView({ padding: 0.15, duration: 200 });
        }
      }, 150);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [rfInstance]);

  return {
    documentView,
    isExporting,
    isFullscreen,
    isOcrDialogOpen,
    isRcmImportDialogOpen,
    rfInstance,
    containerRef,
    setDocumentView,
    setIsExporting,
    setIsOcrDialogOpen,
    setIsRcmImportDialogOpen,
    setRfInstance,
    handleFitView,
    toggleFullscreen,
  };
}
