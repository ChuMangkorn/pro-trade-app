'use client';
import React from 'react';

const DarkModeToggle: React.FC = () => {
  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="ml-4 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
    >
      🌓 Toggle Dark Mode
    </button>
  );
};

export default DarkModeToggle;
