import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, callback, preventDefault = true }) => {
        const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();
        const isCtrlMatch = ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const isMetaMatch = metaKey ? event.metaKey : !event.metaKey;
        const isShiftMatch = shiftKey ? event.shiftKey : !event.shiftKey;

        if (isKeyMatch && isCtrlMatch && isMetaMatch && isShiftMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

export function useModalKeyboardShortcuts(
  onSave?: () => void,
  onCancel?: () => void,
  enabled: boolean = true
) {
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrlKey: true,
      callback: () => onSave?.(),
    },
    {
      key: 'Escape',
      callback: () => onCancel?.(),
    }
  ], enabled);
}

export function useFormKeyboardShortcuts(
  onSubmit?: () => void,
  onReset?: () => void,
  enabled: boolean = true
) {
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrlKey: true,
      callback: () => onSubmit?.(),
    },
    {
      key: 'r',
      ctrlKey: true,
      callback: () => onReset?.(),
    }
  ], enabled);
}