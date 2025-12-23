import { createWindow } from './helpers/create-window';
import path from 'path';

const todoWindow = createWindow('main', {
  width: 450,
  height: 900,
  frame: false,
  alwaysOnTop: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
});

export { todoWindow };
