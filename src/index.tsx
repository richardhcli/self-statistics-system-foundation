
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/css/global.css';
import '@/assets/css/layout.css';
import App from '@/app/app';
import { AppProvider } from '@/app/provider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
//strict mode is enabled to help identify potential issues in development. It does not affect production builds (npm run build) and is only active in development mode (npm start). It intentionally causes components to render twice in development to help catch side effects and other issues early on.
//strict mode is the reason why some components may render twice in development, but this is intentional to help catch side effects and other issues early on. It does not impact production performance or behavior.
root.render(
  <React.StrictMode> 
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
