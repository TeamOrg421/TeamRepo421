import { useEffect, useState } from 'react';
import type { ToastKind } from '../services/toast';
import './ToastHost.css';

interface ToastMessage {
  message: string;
  kind: ToastKind;
}

export default function ToastHost() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastMessage>).detail;
      if (detail?.message) setToast(detail);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;
  return <div className={`app-toast app-toast-${toast.kind}`} role="status">{toast.message}</div>;
}
