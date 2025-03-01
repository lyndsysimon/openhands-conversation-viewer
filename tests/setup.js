import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add fetch polyfill
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({})
}));

// Mock marked library
global.marked = {
  parse: jest.fn(text => text)
};