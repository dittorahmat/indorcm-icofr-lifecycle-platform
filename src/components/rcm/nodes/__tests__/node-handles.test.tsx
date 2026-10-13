import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import type { ReactNode } from 'react';
import { ActivityNode, DecisionNode, StartEndNode } from '../ProcessNodes';

function renderNode(ui: ReactNode) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

function handleIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-handleid]'))
    .map((el) => el.getAttribute('data-handleid') || '')
    .filter(Boolean);
}

const activityData = { label: 'Kerja', role: 'Staf', isLocked: false };
const decisionData = { label: 'Setuju?', isLocked: false };
// React Flow v11 NodeProps carries wrapper positioning props; tests supply fixtures.
const wrapperProps = { zIndex: 10, isConnectable: true, xPos: 0, yPos: 0, dragging: false };

describe('node connection handles (canonical DOM coverage)', () => {
  it('activity exposes the full 8-point canonical set', () => {
    const { container } = renderNode(
      <ActivityNode id="a" type="activity" data={activityData} selected={false} {...wrapperProps} />,
    );
    const ids = handleIds(container);
    for (const id of [
      'top',
      'top-src',
      'left',
      'left-src',
      'right',
      'right-tgt',
      'bottom',
      'bottom-tgt',
      't-l',
      't-l-src',
      't-r',
      't-r-src',
      'b-l',
      'b-l-src',
      'b-r',
      'b-r-src',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('decision exposes canonical side pairs without floating corners, keeping no/yes', () => {
    const { container } = renderNode(
      <DecisionNode id="d" type="decision" data={decisionData} selected={false} {...wrapperProps} />,
    );
    const ids = handleIds(container);
    for (const id of [
      'top',
      'top-src',
      'left',
      'left-src',
      'right',
      'right-tgt',
      'bottom',
      'bottom-tgt',
      'no',
      'yes',
    ]) {
      expect(ids).toContain(id);
    }
    for (const id of ['t-l', 't-l-src', 't-r', 't-r-src', 'b-l', 'b-l-src', 'b-r', 'b-r-src']) {
      expect(ids).not.toContain(id);
    }
  });

  it('start/end expose the canonical single id matching their direction', () => {
    const start = renderNode(
      <StartEndNode id="s" type="start" data={{ label: 'Mulai', type: 'start' }} selected={false} {...wrapperProps} />,
    );
    expect(handleIds(start.container)).toContain('bottom');
    start.unmount();
    const end = renderNode(
      <StartEndNode id="e" type="end" data={{ label: 'Selesai', type: 'end' }} selected={false} {...wrapperProps} />,
    );
    expect(handleIds(end.container)).toContain('top');
  });

  it('locked nodes render no 8-point handles', () => {
    const { container } = renderNode(
      <ActivityNode
        id="a"
        type="activity"
        data={{ ...activityData, isLocked: true }}
        selected={false}
        {...wrapperProps}
      />,
    );
    expect(handleIds(container)).toHaveLength(0);
  });
});
