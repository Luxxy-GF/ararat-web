'use client';

import React, { createContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

type EventType = 'operation' | 'logging' | 'lifecycle';

interface IncusEvent {
  type: EventType;
  timestamp: string;
  metadata: unknown;
}

interface OperationMetadata {
  id: string;
  class: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: string;
  status_code: number;
  resources: Record<string, string[]>;
  metadata: {
    download_progress?: string;
    percent?: number;
    [key: string]: unknown;
  } | null; // specific operation metadata (e.g. progress)
  may_cancel: boolean;
  err: string;
  location: string;
}

type EventEmitterContextValue = {
  isConnected: boolean;
};

const EventEmitterContext = createContext<EventEmitterContextValue>({
  isConnected: false,
});

export default EventEmitterContext;

export function EventEmitterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  // Track operations we are already showing toasts for to avoid duplicates/spam
  const activeOperations = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let reconnectAttempts = 0;
    let reconnectTimeout: number | undefined;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${window.location.host}/1.0/events?type=operation,lifecycle,logging`;

      console.log('Connecting to events:', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Events WebSocket connected');
        setIsConnected(true);
        reconnectAttempts = 0;
        // Clear activeOperations on reconnect to avoid memory leaks
        activeOperations.current.clear();
      };

      ws.onclose = () => {
        console.log('Events WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect after 3 seconds with exponential backoff
        const reconnectDelay = Math.min(
          3000 * Math.pow(2, reconnectAttempts),
          30000,
        );
        reconnectAttempts++;
        reconnectTimeout = window.setTimeout(connect, reconnectDelay);
      };

      ws.onerror = (error) => {
        console.error('Events WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as IncusEvent;

          if (data.type === 'operation') {
            handleOperationEvent(data.metadata as OperationMetadata);
          }
        } catch (e) {
          console.error('Failed to parse event data:', e);
        }
      };
    };

    const handleOperationEvent = (op: OperationMetadata) => {
      // Handle all operation events: status can be Pending, Running, Success, Failure, or Cancelled
      // status: Pending, Running, Success, Failure, Cancelled

      const toastId = op.id;
      const description = op.description || 'Operation';

      // If it's a new operation we haven't seen, or an update to one we are tracking
      if (op.status === 'Pending' || op.status === 'Running') {
        activeOperations.current.add(toastId);

        let progressDetails = '';
        if (op.metadata) {
          // Try to extract progress info
          // Common patterns: metadata: { download_progress: "12%" } or similar
          if (op.metadata.download_progress) {
            progressDetails = `Downloading: ${op.metadata.download_progress}`;
          } else if (op.metadata.percent) {
            progressDetails = `${op.metadata.percent}%`;
          }
        }

        toast.loading(description, {
          id: toastId,
          description: progressDetails || op.status,
        });
      } else if (op.status === 'Success') {
        // Always show a toast for terminal states, even if not previously tracked
        toast.success(description, {
          id: toastId,
          description: 'Completed successfully',
        });
        activeOperations.current.delete(toastId);
      } else if (op.status === 'Failure') {
        toast.error(description, {
          id: toastId,
          description: op.err || 'Operation failed',
        });
        activeOperations.current.delete(toastId);
      } else if (op.status === 'Cancelled') {
        toast.info(description, {
          id: toastId,
          description: 'Cancelled',
        });
        activeOperations.current.delete(toastId);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      activeOperations.current.clear();
    };
  }, []);

  return (
    <EventEmitterContext.Provider value={{ isConnected }}>
      {children}
    </EventEmitterContext.Provider>
  );
}
