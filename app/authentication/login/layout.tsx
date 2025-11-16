import LoginBackground from "./loginBackground";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoginBackground>
      <div className="m-auto w-full max-w-xl p-4 min-w-xs">{children}</div>
    </LoginBackground>
  );
}
