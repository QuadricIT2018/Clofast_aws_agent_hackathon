import React from "react";
import { Toaster } from "sonner";

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "rounded-xl shadow-lg font-medium text-sm",
        duration: 4000,
        style: {
          background: "white",
          color: "#1e1e1e",
        },
      }}
    />
  );
};

export default ToastProvider;
