import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ViewerProvider } from './context/ViewerContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ViewerProvider>
        <AppRoutes />
      </ViewerProvider>
    </BrowserRouter>
  );
}
