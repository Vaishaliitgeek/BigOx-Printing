import { toast } from "react-toastify";

const toastIdMap = {};

export const showProgress = (key, message) => {
    toastIdMap[key] = toast.loading(message, {
        closeButton: true,
        autoClose: 4000  // loading state → no close
    });
};

export const showSuccess = (key, message) => {
    toast.update(toastIdMap[key], {
        render: message,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,    // ✅ REQUIRED
    });
};

export const showError = (key, message) => {
    toast.update(toastIdMap[key], {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,    // ✅ REQUIRED
    });
};

export const dismissToast = (key) => {
    if (toastIdMap[key]) {
        toast.dismiss(toastIdMap[key]);
        delete toastIdMap[key];
    }
};