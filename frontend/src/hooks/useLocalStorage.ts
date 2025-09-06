import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook for persisting filters with expiration
export function usePersistedFilters<T extends Record<string, unknown>>(
  key: string, 
  initialValue: T,
  expirationMinutes?: number
) {
  const [filters, setFilters] = useLocalStorage(key, {
    data: initialValue,
    timestamp: Date.now(),
  });

  // Check if filters have expired
  const isExpired = expirationMinutes && 
    Date.now() - filters.timestamp > (expirationMinutes * 60 * 1000);

  const currentFilters = isExpired ? initialValue : filters.data;

  const updateFilters = (newFilters: T | ((prevFilters: T) => T)) => {
    const updatedFilters = typeof newFilters === 'function' 
      ? newFilters(currentFilters) 
      : newFilters;
    
    setFilters({
      data: updatedFilters,
      timestamp: Date.now(),
    });
  };

  return [currentFilters, updateFilters] as const;
}