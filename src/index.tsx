/* eslint-disable import/first */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';

enableMapSet();

import './Chat/index.scss';

import settings from './Chat/client/state/settings';

import App from './App';
import ChatWrapper2 from './Chat/ChatWrapper2/ChatWrapper2';

document.body.classList.add(configClass, varsClass);
settings.applyTheme();

const mountApp = () => {
  const rootContainer = document.getElementById('root');

  if (rootContainer === null) {
    console.error('Root container element not found!');
    return;
  }

  const root = createRoot(rootContainer);
  // root.render(<ChatWrapper2 />);
  root.render(<App />);
};

mountApp();
