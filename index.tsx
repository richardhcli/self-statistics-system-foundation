
import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/global.css';
import './assets/css/layout.css';
import App from '@/app/app';
import { AppProvider } from '@/app/provider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
