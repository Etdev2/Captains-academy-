// The interactive prototypes at /prototypes/live (see Shell.tsx).

import '@/styles/theme.css';
import './live.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from './Shell';

const root = document.getElementById('root');
if (!root) throw new Error('prototypes/live/index.html has no #root.');
createRoot(root).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
