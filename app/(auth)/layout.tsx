export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="auth-grid">{children}</div>;
}
