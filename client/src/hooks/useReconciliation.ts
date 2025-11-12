import { useContext } from "react";
import ReconciliationContext from "../context/ReconciliationContext";

export function useReconciliation() {
  const context = useContext(ReconciliationContext);
  if (!context) {
    throw new Error(
      "useReconciliation must be used within a ReconciliationProvider"
    );
  }
  return context;
}
