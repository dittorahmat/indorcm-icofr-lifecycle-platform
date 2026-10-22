import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { OcrReviewView } from '../OcrReviewView';

// Mock ReactFlow to keep the test lightweight and avoid WebGL/Canvas rendering requirements
vi.mock('reactflow', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-react-flow">{children}</div>,
  Background: () => <div data-testid="mock-bg" />,
  BackgroundVariant: { Dots: 'dots' },
  Controls: () => <div data-testid="mock-controls" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; count?: number }) => {
      if (key === 'bpm:ocr.originalImage') return 'Source Reference Image';
      if (key === 'bpm:ocr.shapeDetection') return 'Extracted Elements Preview';
      if (key === 'bpm:ocr.staging.thumbnailHint') return 'Compare with original BPM document';
      if (key === 'bpm:ocr.staging.canvasHint') return 'Click and drag to reposition';
      return opts?.defaultValue ?? key;
    },
  }),
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
    const image = screen.getByAltText('Source Diagram');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', dummyProps.ocrPreviewUrl);

    // Verify side-by-side / split-view reference container exists
    expect(screen.getByText(/Source Reference Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Extracted Elements Preview/i)).toBeInTheDocument();

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

    expect(screen.getByText('Halaman 1')).toBeInTheDocument();
    expect(screen.getByText('Halaman 2')).toBeInTheDocument();
  });
});
