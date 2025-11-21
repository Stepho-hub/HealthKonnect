import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Get Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

console.log('Main.tsx Debug - PUBLISHABLE_KEY present:', !!PUBLISHABLE_KEY, 'DEMO_MODE:', DEMO_MODE);

// Only use Clerk if we have a publishable key
const USE_CLERK = !!PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {USE_CLERK ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
