import '@testing-library/jest-dom';

// Mock ResizeObserver for recharts/ResponsiveContainer
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
} 