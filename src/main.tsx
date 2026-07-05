import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to support Vercel (static) + Railway (API) separation
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    const apiBase = import.meta.env.VITE_API_URL || '';
    input = `${apiBase}${input}`;
  }

  try {
    const response = await originalFetch(input, init);

    // Capture the original response structure and override its json method
    const originalJson = response.json.bind(response);
    response.json = async function () {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (jsonErr) {
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE html>') || text.includes('The page could not be found')) {
          throw new Error(
            `The API server returned an HTML error instead of JSON. ` +
            `This means your VITE_API_URL environment variable ("${import.meta.env.VITE_API_URL || 'NOT SET'}") is either missing, pointing to a dead URL, or you haven't redeployed your frontend on Vercel after setting it. Please confirm your Railway backend is running and redeploy on Vercel.`
          );
        }
        throw jsonErr;
      }
    };

    return response;
  } catch (err: any) {
    console.error('[Global Fetch Interceptor Exception]', err);
    throw err;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
