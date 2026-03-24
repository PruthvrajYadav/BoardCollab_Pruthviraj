import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-konva to prevent native 'canvas' module require errors in JSDOM
vi.mock('react-konva', () => {
  return {
    Stage: ({ children }) => <div data-testid="mock-stage">{children}</div>,
    Layer: ({ children }) => <div data-testid="mock-layer">{children}</div>,
    FastLayer: ({ children }) => <div data-testid="mock-fastlayer">{children}</div>,
    Line: () => <div data-testid="mock-line" />,
    Rect: () => <div data-testid="mock-rect" />,
    Circle: () => <div data-testid="mock-circle" />,
    Text: () => <div data-testid="mock-text" />,
  };
});
