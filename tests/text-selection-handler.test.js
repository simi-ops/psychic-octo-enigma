/**
 * Unit tests for TextSelectionHandler functionality
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><p>Test content</p></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

// Import the TextSelectionHandler class
const { TextSelectionHandler } = require('../src/content/content-script.js');

describe('TextSelectionHandler', () => {
  let handler;
  
  beforeEach(() => {
    handler = new TextSelectionHandler();
  });

  describe('validateSelection', () => {
    test('should return false for null selection', () => {
      expect(handler.validateSelection(null)).toBe(false);
    });

    test('should return false for empty selection', () => {
      const mockSelection = {
        rangeCount: 0,
        toString: () => ''
      };
      expect(handler.validateSelection(mockSelection)).toBe(false);
    });

    test('should return false for short text (< 3 characters)', () => {
      const mockSelection = {
        rangeCount: 1,
        toString: () => 'ab',
        getRangeAt: () => ({
          commonAncestorContainer: {
            nodeType: Node.TEXT_NODE,
            parentElement: document.createElement('p')
          }
        })
      };
      expect(handler.validateSelection(mockSelection)).toBe(false);
    });

    test('should return false for whitespace-only text', () => {
      const mockSelection = {
        rangeCount: 1,
        toString: () => '   \n\t   ',
        getRangeAt: () => ({
          commonAncestorContainer: {
            nodeType: Node.TEXT_NODE,
            parentElement: document.createElement('p')
          }
        })
      };
      expect(handler.validateSelection(mockSelection)).toBe(false);
    });

    test('should return false for text longer than 10000 characters', () => {
      const longText = 'a'.repeat(10001);
      const mockSelection = {
        rangeCount: 1,
        toString: () => longText,
        getRangeAt: () => ({
          commonAncestorContainer: {
            nodeType: Node.TEXT_NODE,
            parentElement: document.createElement('p')
          }
        })
      };
      expect(handler.validateSelection(mockSelection)).toBe(false);
    });

    test('should return true for valid text selection', () => {
      const mockSelection = {
        rangeCount: 1,
        toString: () => 'Valid test content',
        getRangeAt: () => ({
          commonAncestorContainer: {
            nodeType: Node.TEXT_NODE,
            parentElement: document.createElement('p')
          }
        })
      };
      expect(handler.validateSelection(mockSelection)).toBe(true);
    });
  });

  describe('isWithinEditableElement', () => {
    test('should return true for input elements', () => {
      const input = document.createElement('input');
      expect(handler.isWithinEditableElement(input)).toBe(true);
    });

    test('should return true for textarea elements', () => {
      const textarea = document.createElement('textarea');
      expect(handler.isWithinEditableElement(textarea)).toBe(true);
    });

    test('should return true for contenteditable elements', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      expect(handler.isWithinEditableElement(div)).toBe(true);
    });

    test('should return false for regular elements', () => {
      const p = document.createElement('p');
      expect(handler.isWithinEditableElement(p)).toBe(false);
    });
  });
});
