import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Provider } from "react-redux";
import { store } from "./app/store"
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './app/store.js';
import { ToastProvider } from './components/ui/toast.js';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <StrictMode>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StrictMode>
    </PersistGate>
  </Provider>
)
