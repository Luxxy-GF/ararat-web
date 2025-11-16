"use client";

import { useState } from "react";

export default function LoginBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const [imageIndex] = useState<number>(
    () => Math.floor(Math.random() * 10) + 1
  );
  return (
    <div
      className={`h-screen bg-cover flex bg-center`}
      style={{
        backgroundImage: `url('/ui/images/login/login${imageIndex}.jpg')`,
      }}
    >
      <div className="dark:backdrop-brightness-75 w-full h-full flex">
        {children}
      </div>
    </div>
  );
}
