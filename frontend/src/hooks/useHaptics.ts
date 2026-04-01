import { triggerHaptic } from "../services/telegram";

export function useHaptics() {
  return {
    tap: () => triggerHaptic("selection"),
    soft: () => triggerHaptic("impact-light"),
    medium: () => triggerHaptic("impact-medium"),
    heavy: () => triggerHaptic("impact-heavy"),
  };
}
