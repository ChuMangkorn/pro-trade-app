'use client';
import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface FlashableProps {
  children: ReactNode;
  value: number | string;
  // Optional: A unique key can force a re-flash even if the value is the same (e.g., for repeated trades at the same price)
  flashKey?: string | number; 
}

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const Flashable: React.FC<FlashableProps> = ({ children, value, flashKey }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevValue = usePrevious(Number(value));

  useEffect(() => {
    if (prevValue !== undefined && Number(value) !== prevValue) {
      const className = Number(value) > prevValue ? 'flash-up' : 'flash-down';
      setFlashClass(className);

      const timer = setTimeout(() => {
        setFlashClass('');
      }, 500); // Duration should match the animation duration in CSS

      return () => clearTimeout(timer);
    }
  }, [value, prevValue, flashKey]); // Include flashKey in dependencies

  // Using a key on the span ensures React replaces the element, thus re-triggering the animation
  // if the flashClass is set to the same value again quickly.
  return <span key={flashClass ? Date.now() : undefined} className={flashClass}>{children}</span>;
};

export default Flashable; 