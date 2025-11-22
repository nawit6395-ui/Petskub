import Swal, { SweetAlertIcon, SweetAlertOptions } from "sweetalert2";

export type AlertOptions = {
  description?: string;
} & Omit<SweetAlertOptions, "title" | "text" | "icon">;

const baseOptions: Pick<SweetAlertOptions, "confirmButtonColor" | "cancelButtonColor"> = {
  confirmButtonColor: "#f97316",
  cancelButtonColor: "#94a3b8",
};

const showAlert = (icon: SweetAlertIcon, title: string, options?: AlertOptions) => {
  const { description, ...rest } = options ?? {};

  return Swal.fire({
    icon,
    title,
    text: description,
    ...baseOptions,
    ...rest,
  });
};

export const alert = {
  success: (title: string, options?: AlertOptions) =>
    showAlert("success", title, { timer: 2200, showConfirmButton: false, ...options }),
  error: (title: string, options?: AlertOptions) =>
    showAlert("error", title, { showConfirmButton: true, ...options }),
  info: (title: string, options?: AlertOptions) =>
    showAlert("info", title, { timer: 2200, showConfirmButton: false, ...options }),
  warning: (title: string, options?: AlertOptions) =>
    showAlert("warning", title, { showConfirmButton: true, ...options }),
  confirm: (
    title: string,
    options?: AlertOptions & { confirmText?: string; cancelText?: string }
  ) =>
    Swal.fire({
      icon: "warning",
      title,
      text: options?.description,
      showCancelButton: true,
      confirmButtonText: options?.confirmText ?? "ยืนยัน",
      cancelButtonText: options?.cancelText ?? "ยกเลิก",
      focusCancel: true,
      ...baseOptions,
      ...options,
    }),
};
