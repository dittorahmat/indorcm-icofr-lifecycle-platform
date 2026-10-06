import { describe, it, expect } from 'vitest';
import { OCR_NODE_TYPE_OPTIONS, getOcrOptionLabelKey, getOcrShapeBadge } from '../ocr-shape-badges';

describe('ocr-shape-badges', () => {
  it('resolves a badge per known shape type', () => {
    expect(getOcrShapeBadge('start').labelKey).toBe('bpm:ocr.shapes.start');
    expect(getOcrShapeBadge('decision').iconBg).toContain('rotate-45');
    expect(getOcrShapeBadge('swimlane').labelKey).toBe('bpm:editor.nodes.swimlane');
  });

  it('falls back to the activity badge for unknown or missing types', () => {
    expect(getOcrShapeBadge('not-a-shape')).toEqual(getOcrShapeBadge('activity'));
    expect(getOcrShapeBadge(undefined)).toEqual(getOcrShapeBadge('activity'));
  });

  it('covers every option in the type selector', () => {
    for (const type of OCR_NODE_TYPE_OPTIONS) {
      expect(getOcrShapeBadge(type).labelKey).toBeTruthy();
      expect(getOcrOptionLabelKey(type)).toBeTruthy();
    }
    expect(OCR_NODE_TYPE_OPTIONS).toContain('swimlane');
  });

  it('keeps legacy option label overrides for core shapes', () => {
    expect(getOcrOptionLabelKey('automated-activity')).toBe('bpm:ocr.options.system');
    expect(getOcrOptionLabelKey('data-media')).toBe('bpm:ocr.options.dataMedia');
    expect(getOcrOptionLabelKey('swimlane')).toBe('bpm:editor.nodes.swimlane');
    expect(getOcrOptionLabelKey('merge')).toBe('bpm:ocr.options.merge');
  });
});
