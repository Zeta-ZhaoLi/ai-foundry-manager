import toast from 'react-hot-toast';

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const info = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  const loading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    info,
    loading,
    dismiss,
  };
};
