import ServerConfigMetadataProvider from "@/components/context/serverConfigMetadata";

export default function InstancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServerConfigMetadataProvider>{children}</ServerConfigMetadataProvider>
  );
}
