import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const OFFLINE_TOAST_ID = "network-offline";
const SLOW_TOAST_ID = "network-slow";

function getConnectionInfo() {
  if (typeof navigator === "undefined") return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function isLikelySlowConnection() {
  const connection = getConnectionInfo();
  if (!connection) return false;

  const type = connection.effectiveType || "";
  const downlink = Number(connection.downlink);
  const saveData = Boolean(connection.saveData);

  if (saveData) return true;
  if (type === "slow-2g" || type === "2g") return true;
  if (!Number.isNaN(downlink) && downlink > 0 && downlink < 1) return true;

  return false;
}

export default function NetworkStatusNotifier() {
  const wasOffline = useRef(false);
  const wasSlow = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncNetworkState = () => {
      const offline = !navigator.onLine;
      const slow = !offline && isLikelySlowConnection();

      if (offline) {
        if (!wasOffline.current) {
          toast.error("You are offline. Please check your internet connection.", {
            id: OFFLINE_TOAST_ID,
            duration: Infinity,
          });
        }
      } else if (wasOffline.current) {
        toast.dismiss(OFFLINE_TOAST_ID);
        toast.success("Internet connection restored.");
      }

      if (slow) {
        if (!wasSlow.current) {
          toast((t) => (
            <span>
              Slow internet connection detected. Some requests may take longer.
              <button
                type="button"
                className="ml-3 text-blue-600 underline"
                onClick={() => toast.dismiss(t.id)}
              >
                Dismiss
              </button>
            </span>
          ), {
            id: SLOW_TOAST_ID,
            duration: 7000,
            icon: "⚠️",
          });
        }
      } else if (wasSlow.current) {
        toast.dismiss(SLOW_TOAST_ID);
      }

      wasOffline.current = offline;
      wasSlow.current = slow;
    };

    syncNetworkState();

    const connection = getConnectionInfo();
    window.addEventListener("offline", syncNetworkState);
    window.addEventListener("online", syncNetworkState);
    connection?.addEventListener?.("change", syncNetworkState);

    return () => {
      window.removeEventListener("offline", syncNetworkState);
      window.removeEventListener("online", syncNetworkState);
      connection?.removeEventListener?.("change", syncNetworkState);
    };
  }, []);

  return null;
}
