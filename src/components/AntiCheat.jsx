import { useEffect } from 'react';
import toast from '../utils/toast';

export default function AntiCheat({ onPenalty, onViolation }) {
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);

    const handleVisibility = () => {
      if (document.hidden) {
        onPenalty(30);
        onViolation(); // Trigger the strike system
        // Using toast.error automatically applies the red background from main.jsx
        toast.error("CHEATING DETECTED: 30s deducted for switching tabs!", {
          icon: '🚨',
          duration: 5000
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [onPenalty, onViolation]);

  return null;
}