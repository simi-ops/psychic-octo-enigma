/**
 * Unit tests for HintsUI class
 */

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

describe('HintsUI', () => {
  let hintsUI;
  
  beforeEach(() => {
    hintsUI = {
      show: jest.fn(),
      hide: jest.fn(),
      updateMetrics: jest.fn(),
      getVisibility: jest.fn(() => true),
      createPanel: jest.fn(() => document.createElement('div')),
      destroy: jest.fn()
    };
  });

  test('should show hints panel', () => {
    hintsUI.show();
    
    expect(hintsUI.show).toHaveBeenCalled();
  });

  test('should hide hints panel', () => {
    hintsUI.hide();
    
    expect(hintsUI.hide).toHaveBeenCalled();
  });

  test('should update metrics display', () => {
    const metrics = { wpm: 45, accuracy: 95 };
    hintsUI.updateMetrics(metrics);
    
    expect(hintsUI.updateMetrics).toHaveBeenCalledWith(metrics);
  });

  test('should get visibility status', () => {
    const isVisible = hintsUI.getVisibility();
    
    expect(isVisible).toBe(true);
    expect(hintsUI.getVisibility).toHaveBeenCalled();
  });

  test('should create hints panel', () => {
    const panel = hintsUI.createPanel();
    
    expect(panel).toBeInstanceOf(HTMLElement);
    expect(hintsUI.createPanel).toHaveBeenCalled();
  });

  test('should destroy hints panel', () => {
    hintsUI.destroy();
    
    expect(hintsUI.destroy).toHaveBeenCalled();
  });

  test('should handle real-time updates', () => {
    const metrics1 = { wpm: 30, accuracy: 90 };
    const metrics2 = { wpm: 35, accuracy: 92 };
    
    hintsUI.updateMetrics(metrics1);
    hintsUI.updateMetrics(metrics2);
    
    expect(hintsUI.updateMetrics).toHaveBeenCalledTimes(2);
    expect(hintsUI.updateMetrics).toHaveBeenLastCalledWith(metrics2);
  });
});
