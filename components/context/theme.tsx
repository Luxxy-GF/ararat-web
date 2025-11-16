"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ServerConfigContext } from "./serverConfig";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const { data } = React.use(ServerConfigContext);
  const [theme, setTheme] = React.useState<string>(
    !data
      ? "system"
      : data.config["user.ui.theme"] || data.config["user.ui_theme"] || "system"
  );
  React.useEffect(() => {
    if (data) {
      const serverTheme =
        data.config["user.ui.theme"] ||
        data.config["user.ui_theme"] ||
        "system";
      setTheme(serverTheme);
    }
  }, [data]);

  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme={theme}
      forcedTheme={theme == "system" ? undefined : (theme as string)}
      enableSystem={theme == "system" ? true : false}
    >
      {children}
    </NextThemesProvider>
  );
}
