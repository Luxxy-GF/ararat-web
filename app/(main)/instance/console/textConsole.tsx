'use client';
import '@xterm/xterm/css/xterm.css';

import { useCallback, useEffect, use, useRef, useMemo } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { InstanceContext } from '../_context/instance';

export default function InstanceTextConsole() {
  const { instanceClass: instance, isLoading } = use(InstanceContext);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Stable refs that persist across strict mode double renders
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const dataSocketRef = useRef<WebSocket | null>(null);
  const controlSocketRef = useRef<WebSocket | null>(null);
  const initializedRef = useRef(false);
  const inputDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const socketAttachedRef = useRef(false);
  const connectedNameRef = useRef<string | null>(null);
  const textEncoderRef = useRef(new TextEncoder());

  // Detect dark mode once
  const isDark = useMemo(
    () =>
      typeof window !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
    [],
  );

  // Initialize terminal once and wire everything
  const attachToSocket = useCallback(() => {
    const sock = dataSocketRef.current;
    const term = termRef.current;
    if (!sock || !term || socketAttachedRef.current) return;

    const setupSocket = () => {
      if (socketAttachedRef.current) return; // Prevent double setup
      socketAttachedRef.current = true;

      // Handle incoming messages - decode text
      sock.onmessage = async (ev: MessageEvent<Blob>) => {
        try {
          const text = await ev.data.text();
          term.write(text);
        } catch {}
      };

      sock.onerror = () => {
        try {
          term.writeln('\r\n[console] Data socket error.');
        } catch {}
      };

      sock.onclose = () => {
        try {
          term.writeln('[console] Data socket closed.');
        } catch {}
      };

      // Dispose previous listener if any
      inputDisposableRef.current?.dispose();

      // Forward terminal input to socket with TextEncoder
      inputDisposableRef.current = term.onData((data: string) => {
        try {
          if (sock.readyState === WebSocket.OPEN) {
            sock.send(textEncoderRef.current.encode(data));
          }
        } catch {}
      });

      term.focus();
    };

    if (sock.readyState === WebSocket.OPEN) {
      setupSocket();
    } else {
      const onOpen = () => {
        setupSocket();
        sock.removeEventListener('open', onOpen);
      };
      sock.addEventListener('open', onOpen);
    }
  }, []);

  // Open sockets once when instance is ready
  useEffect(() => {
    if (isLoading || !instance) return;

    // If instance name changed, reset
    if (connectedNameRef.current !== instance.name) {
      initializedRef.current = false;
      try {
        dataSocketRef.current?.close();
      } catch {}
      try {
        controlSocketRef.current?.close();
      } catch {}
      connectedNameRef.current = instance.name;
    }

    if (initializedRef.current) return;

    initializedRef.current = true;
    (async () => {
      // Preload previous log before attaching
      try {
        const prelog = await instance.getConsoleOutput();
        if (prelog && termRef.current) {
          termRef.current.write(prelog);
        }
      } catch (err) {
        // Surface error inline in terminal area
        if (termRef.current) {
          termRef.current.write(
            `\r\n[console] Failed to load previous log.\r\n`,
          );
        }
      }

      const { data, control } = await instance.openConsoleSocket('console', {
        width: termRef.current?.cols,
        height: termRef.current?.rows,
      });
      dataSocketRef.current = data;
      controlSocketRef.current = control;

      // Attach immediately if terminal is ready
      attachToSocket();
    })().catch(() => {
      initializedRef.current = false;
    });
  }, [isLoading, instance]);

  // Initialize terminal once and wire everything
  useEffect(() => {
    const host = terminalRef.current;
    if (!host || termRef.current) return;

    // Theme matching your UI's card background and text colors
    const term = new Terminal({
      cursorBlink: true,
      disableStdin: false,
      fontFamily: 'var(--font-geist-mono), monospace',
      fontSize: 13,
      lineHeight: 1.4,
      theme: isDark
        ? {
            background: 'oklch(0.205 0 0)', // --card dark
            foreground: 'oklch(0.985 0 0)', // --foreground dark
            cursor: 'oklch(0.922 0 0)',
            cursorAccent: 'oklch(0.205 0 0)',
            selectionBackground: 'oklch(0.269 0 0 / 0.5)', // --muted dark
            black: 'oklch(0.145 0 0)',
            red: 'oklch(0.704 0.191 22.216)',
            green: 'oklch(0.696 0.17 162.48)',
            yellow: 'oklch(0.769 0.188 70.08)',
            blue: 'oklch(0.488 0.243 264.376)',
            magenta: 'oklch(0.627 0.265 303.9)',
            cyan: 'oklch(0.645 0.246 16.439)',
            white: 'oklch(0.985 0 0)',
            brightBlack: 'oklch(0.556 0 0)',
            brightRed: 'oklch(0.704 0.191 22.216)',
            brightGreen: 'oklch(0.696 0.17 162.48)',
            brightYellow: 'oklch(0.769 0.188 70.08)',
            brightBlue: 'oklch(0.488 0.243 264.376)',
            brightMagenta: 'oklch(0.627 0.265 303.9)',
            brightCyan: 'oklch(0.645 0.246 16.439)',
            brightWhite: 'oklch(0.985 0 0)',
          }
        : {
            background: 'oklch(1 0 0)', // --card light
            foreground: 'oklch(0.145 0 0)', // --foreground light
            cursor: 'oklch(0.205 0 0)',
            cursorAccent: 'oklch(1 0 0)',
            selectionBackground: 'oklch(0.97 0 0 / 0.5)', // --muted light
            black: 'oklch(0.145 0 0)',
            red: 'oklch(0.577 0.245 27.325)',
            green: 'oklch(0.6 0.118 184.704)',
            yellow: 'oklch(0.828 0.189 84.429)',
            blue: 'oklch(0.398 0.07 227.392)',
            magenta: 'oklch(0.646 0.222 41.116)',
            cyan: 'oklch(0.769 0.188 70.08)',
            white: 'oklch(0.985 0 0)',
            brightBlack: 'oklch(0.556 0 0)',
            brightRed: 'oklch(0.577 0.245 27.325)',
            brightGreen: 'oklch(0.6 0.118 184.704)',
            brightYellow: 'oklch(0.828 0.189 84.429)',
            brightBlue: 'oklch(0.398 0.07 227.392)',
            brightMagenta: 'oklch(0.646 0.222 41.116)',
            brightCyan: 'oklch(0.769 0.188 70.08)',
            brightWhite: 'oklch(0.985 0 0)',
          },
    });
    const fit = new FitAddon();
    termRef.current = term;
    fitRef.current = fit;

    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(host);

    const fitIfReady = () => {
      try {
        if (host.clientWidth > 0 && host.clientHeight > 0) {
          fitRef.current?.fit();
        }
      } catch {}
    };
    // Initial fit and next-tick retry
    fitIfReady();
    setTimeout(fitIfReady, 0);

    // Window resize handler only (avoids ResizeObserver feedback loop)
    const handleResize = () => {
      fitIfReady();
      const ctrl = controlSocketRef.current;
      if (ctrl && ctrl.readyState === WebSocket.OPEN && termRef.current) {
        try {
          ctrl.send(
            JSON.stringify({
              type: 'window-resize',
              metadata: {
                width: termRef.current.cols,
                height: termRef.current.rows,
              },
            }),
          );
        } catch {}
      }
    };
    window.addEventListener('resize', handleResize);

    // Try attach immediately and also after a short delay in case sockets arrive later
    attachToSocket();
    const retryTimer = window.setTimeout(attachToSocket, 50);

    // If we have an active socket but terminal was recreated, force re-attach
    if (
      dataSocketRef.current &&
      dataSocketRef.current.readyState === WebSocket.OPEN
    ) {
      socketAttachedRef.current = false;
      attachToSocket();
    }

    return () => {
      clearTimeout(retryTimer);
      window.removeEventListener('resize', handleResize);
      socketAttachedRef.current = false;
      try {
        inputDisposableRef.current?.dispose();
      } catch {}
      try {
        termRef.current?.dispose();
      } catch {}
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  // Cleanup sockets on unmount
  useEffect(() => {
    return () => {
      try {
        dataSocketRef.current?.close();
      } catch {}
      try {
        controlSocketRef.current?.close();
      } catch {}
    };
  }, []);

  return (
    <div className="w-full" style={{ height: '60vh', minHeight: '300px' }}>
      {/* Outer visual container controls padding/border without affecting terminal fit */}
      <div className="h-full w-full rounded-lg border bg-card shadow-sm font-mono p-3 box-border overflow-hidden">
        {/* Host element must be padding-free to let FitAddon calculate width correctly */}
        <div
          ref={terminalRef}
          className="h-full w-full"
          tabIndex={0}
          role="textbox"
          aria-label="Instance Console"
          onClick={() => {
            try {
              termRef.current?.focus();
            } catch {}
          }}
        />
        {/* Simple retry control */}
        <div className="mt-2 text-xs text-muted-foreground">
          <button
            className="underline"
            onClick={() => {
              try {
                socketAttachedRef.current = false;
                const sock = dataSocketRef.current;
                if (sock && sock.readyState !== WebSocket.OPEN) {
                  sock.close();
                }
                attachToSocket();
              } catch {}
            }}
          >
            Retry attach
          </button>
        </div>
      </div>
      <style jsx global>{`
        /* Ensure xterm elements never exceed their container width */
        .xterm,
        .xterm .xterm-viewport,
        .xterm .xterm-screen {
          width: 100% !important;
          max-width: 100% !important;
        }
        .xterm {
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        .xterm .xterm-viewport {
          overflow-x: hidden !important;
        }
      `}</style>
    </div>
  );
}
