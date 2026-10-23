import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { OcrReviewView } from '../OcrReviewView';
import { strictT } from '@/test/mock-i18n';

// Mock ReactFlow to keep the test lightweight and avoid WebGL/Canvas rendering requirements
vi.mock('reactflow', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-react-flow">{children}</div>,
  Background: () => <div data-testid="mock-bg" />,
  BackgroundVariant: { Dots: 'dots' },
  Controls: () => <div data-testid="mock-controls" />,
}));

// Strict helper: unknown keys throw instead of silently rendering, so this test
// cannot lock a string the English bundle does not ship.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
}));

describe('OcrReviewView visual comparison & split-view reference', () => {
  const dummyProps = {
    ocrPreviewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    totalPages: 2,
    activePage: 1,
    onSelectPage: vi.fn(),
    stagingNodes: [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    ],
    stagingEdges: [],
    stagingWarnings: [],
    warningsDismissed: false,
    nodeTypes: {},
    edgeTypes: {},
    onDismissWarnings: vi.fn(),
    onInitCanvas: vi.fn(),
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onNodesDelete: vi.fn(),
    onEdgesDelete: vi.fn(),
    onConnect: vi.fn(),
  };

  it('renders original source image alongside extracted elements preview in split-view', () => {
    render(
      <OcrReviewView {...dummyProps}>
        <div data-testid="review-tabs">Tabs Review Content</div>
      </OcrReviewView>
    );

    // Verify source preview image is rendered with correct attributes
    const image = screen.getByAltText('bpm:ocr.sourceAlt');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', dummyProps.ocrPreviewUrl);

    // Verify side-by-side / split-view reference container exists (the hint also
    // carries the active page when there is more than one).
    expect(screen.getByText(/bpm:ocr\.originalImage/)).toBeInTheDocument();
    expect(screen.getByText(/bpm:ocr\.shapeDetection/)).toBeInTheDocument();

    // Verify ReactFlow staging canvas and children elements tab are present
    expect(screen.getByTestId('mock-react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('review-tabs')).toBeInTheDocument();
  });

  it('renders multi-page navigation buttons when totalPages > 1', () => {
    render(
      <OcrReviewView {...dummyProps}>
        <div>Content</div>
      </OcrReviewView>
    );

    // One button per page; the strict mock resolves every key to the key itself.
    expect(screen.getAllByRole('button', { name: 'bpm:ocr.pageNumber' })).toHaveLength(2);
  });

  it('reserves a readable preview height instead of the old 200px strip', () => {
    render(
      <OcrReviewView {...dummyProps}>
        <div>Content</div>
      </OcrReviewView>
    );

    const canvas = screen.getByTestId('mock-react-flow').closest('div[class*="h-[320px]"]');
    expect(canvas).not.toBeNull();
    expect(canvas?.className).toContain('lg:h-[420px]');
  });
});
