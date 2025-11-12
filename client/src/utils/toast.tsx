import { toast } from "sonner";
import { CheckCircle, XCircle, Info } from "lucide-react";

export const showSuccessToast = (message: string): void => {
  toast.success(message, {
    icon: <CheckCircle className="text-green-500" size={20} />,
    style: { borderLeft: "4px solid #22c55e" },
  });
};

export const showErrorToast = (message: string): void => {
  toast.error(message, {
    icon: <XCircle className="text-red-500" size={20} />,
    style: { borderLeft: "4px solid #ef4444" },
  });
};

export const showInfoToast = (message: string): void => {
  toast.info(message, {
    icon: <Info className="text-blue-500" size={20} />,
    style: { borderLeft: "4px solid #3b82f6" },
  });
};
