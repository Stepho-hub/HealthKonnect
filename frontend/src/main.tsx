import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Get Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#dc2626',
            colorBackground: '#ffffff',
            colorInputBackground: '#f8fafc',
            colorInputText: '#1e293b',
          },
          elements: {
            formButtonPrimary: 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90',
            card: 'shadow-lg rounded-xl',
          }
        }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
