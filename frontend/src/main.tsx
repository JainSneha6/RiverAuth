import './tailwind.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Signup3 from './pages/Signup3';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);