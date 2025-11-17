import { ConfigurableOptionsProvider } from "@/components/context/server";

export default function InstancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConfigurableOptionsProvider>{children}</ConfigurableOptionsProvider>;
}
