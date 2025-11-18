"use client";

import React, { createContext, useEffect, useState } from "react";
import { toast } from "sonner";

type EventEmitterContextValue = {
  eventEmitter?: WebSocket;
};

const EventEmitterContext = createContext<EventEmitterContextValue>({
  eventEmitter: undefined,
});
export default EventEmitterContext;

export function EventEmitterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [eventEmitter, setEventEmitter] = useState<WebSocket>();

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/1.0/events`
    );

    const handleOpen = () => {
      setEventEmitter(ws);
    };

    ws.addEventListener("open", handleOpen);
    const pendingOperations: Record<string, object> = {};
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type !== "operation") {
        return;
      }

      if (data.metadata.status === "Running") {
        if (pendingOperations[data.metadata.id]) {
          delete pendingOperations[data.metadata.id];
        }
        return;
      }

      if (data.metadata.status === "Pending") {
        pendingOperations[data.metadata.id] = data;
        toast.promise(
          () =>
            new Promise<{ name: string }>((resolve, reject) => {
              const handleOperationUpdate = (ev: MessageEvent) => {
                const dat = JSON.parse(ev.data);
                if (dat.type !== "operation") {
                  return;
                }

                if (dat.metadata.id !== data.metadata.id) {
                  return;
                }

                if (dat.metadata.status === "Running") {
                  ws.removeEventListener("message", handleOperationUpdate);
                  resolve({ name: "IT WORKS" });
                } else if (dat.metadata.status !== "Pending") {
                  ws.removeEventListener("message", handleOperationUpdate);
                  reject();
                }
              };

              ws.addEventListener("message", handleOperationUpdate);
            }),
          {
            loading: "Loading...",
            success: ({ name }: { name: string }) => `${name} mmm`,
            error: `MMM`,
          }
        );
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, []);

  return (
    <EventEmitterContext.Provider value={{ eventEmitter }}>
      {children}
    </EventEmitterContext.Provider>
  );
}
