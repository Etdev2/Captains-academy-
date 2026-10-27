// The account screen at /account (issue #87): see App.tsx.

import '@/styles/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { enableOffline } from '../offline/offline';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('account/index.html has no #root.');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
void enableOffline();
