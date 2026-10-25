// The decision board at /prototypes (issue #72): see App.tsx.

import '@/styles/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { exposeUrlsForTests } from './round';

const root = document.getElementById('root');
if (!root) throw new Error('prototypes/index.html has no #root.');
exposeUrlsForTests();
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
