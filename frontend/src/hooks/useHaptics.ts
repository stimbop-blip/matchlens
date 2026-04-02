import { useMemo } from "react";
import { impact, notifyError, notifySuccess, selectionChanged } from "../lib/telegram";

export function useHaptics() {
  return useMemo(
    () => ({
      tap: () => selectionChanged(),
      soft: () => impact("soft"),
      medium: () => impact("medium"),
      heavy: () => impact("heavy"),
      success: () => notifySuccess(),
      error: () => notifyError(),
    }),
    [],
  );
}
