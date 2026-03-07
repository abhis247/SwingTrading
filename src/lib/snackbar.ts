import { writable } from "svelte/store";

type SnackbarType = "success" | "error" | "info";

interface SnackbarState {
  show: boolean;
  message: string;
  type: SnackbarType;
}

const createSnackbar = () => {
  const { subscribe, set, update } = writable<SnackbarState>({
    show: false,
    message: "",
    type: "success"
  });

  let timeout: any;

  return {
    subscribe,

    show(message: string, type: SnackbarType = "success") {
      set({ show: true, message, type });

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        update(s => ({ ...s, show: false }));
      }, 3000);
    },

    hide() {
      update(s => ({ ...s, show: false }));
    }
  };
};

export const snackbar = createSnackbar();