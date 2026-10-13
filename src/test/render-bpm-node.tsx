import { render } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import type { ReactNode } from 'react';

// React Flow v11 NodeProps carries wrapper positioning props on top of the
// node fields. Tests rendering node components supply these fixtures.
export const bpmNodeWrapperProps = {
  zIndex: 10,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
};

export function renderBpmNode(ui: ReactNode) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

export function renderedHandleIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-handleid]'))
    .map((el) => el.getAttribute('data-handleid') || '')
    .filter(Boolean);
}
