"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createDemoState } from "@/lib/portal/data.mjs";
import { demoAction, restoreDemo } from "@/lib/portal/service.mjs";

const PortalContext = createContext(null);
const STORAGE_KEY = "kes-portal-frontend-demo-v1";
export default function PortalProvider({ children }) {
  const [state, setState] = useState(createDemoState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [projectRequest, requestProject] = useState(null);
  const current = useRef(state);
  const timeout = useRef(null);
  useEffect(() => {
    let restored = createDemoState();
    try { restored = restoreDemo(sessionStorage.getItem(STORAGE_KEY)); } catch { /* Storage may be unavailable; the demo still works in memory. */ }
    current.current = restored;
    // Restoring browser storage after hydration has to happen in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(restored); setReady(true);
    return () => clearTimeout(timeout.current);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Large photo previews remain usable in memory. */ }
  }, [state, ready]);
  const notify = useCallback((message, error = false) => {
    clearTimeout(timeout.current); setToast({ message, error });
    if (!error) timeout.current = setTimeout(() => setToast(null), 5000);
  }, []);
  const dismissFeedback = useCallback(() => { clearTimeout(timeout.current); setToast(null); }, []);
  const act = useCallback((type, payload, message) => {
    try {
      const next = demoAction(current.current, { type, payload });
      current.current = next; setState(next);
      if (message) notify(message);
      return true;
    } catch (error) { notify(error.message, true); return false; }
  }, [notify]);
  return <PortalContext.Provider value={{ state, ready, act, notify, projectRequest, requestProject, feedback: toast, dismissFeedback }}>
    {children}
    {toast && <div className={`kp-toast${toast.error ? " is-error" : ""}`} style={state.settings.reduceMotion ? { animation: "none" } : undefined} role={toast.error ? "alert" : "status"}><span>{toast.error ? "!" : "✓"}</span>{toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}>×</button></div>}
  </PortalContext.Provider>;
}
export function usePortal() { return useContext(PortalContext); }
