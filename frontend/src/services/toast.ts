export type ToastKind = 'info' | 'success' | 'error';

export const showToast = (message: string, kind: ToastKind = 'info') => {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, kind } }));
};
