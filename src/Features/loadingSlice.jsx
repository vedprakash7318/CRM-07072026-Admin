// src/components/GlobalLoader.jsx
import React from 'react';
import { useSelector } from 'react-redux';

const GlobalLoader = () => {
  const loading = useSelector((state) => state.leads.loading);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
    </div>
  );
};

export default GlobalLoader;
