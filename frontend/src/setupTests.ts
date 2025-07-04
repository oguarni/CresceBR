import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { act } from '@testing-library/react';

// Configure testing library to better handle async updates
configure({
  // Automatically wrap async operations in act()
  asyncUtilTimeout: 5000,
});

// Global act wrapper for all tests
global.act = act;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress React Router warnings in tests
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});
