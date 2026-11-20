import { useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    onConfirm?: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    options: null,
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isLoading: true }));
          resolve(true);
          setTimeout(() => {
            setDialogState({ isOpen: false, options: null });
          }, 300);
        },
        isLoading: false,
      });
    });
  };

  const cancel = () => {
    setDialogState({ isOpen: false, options: null });
  };

  return {
    dialogState,
    confirm,
    cancel,
  };
};
