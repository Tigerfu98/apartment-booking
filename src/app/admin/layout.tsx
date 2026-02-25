import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Casa STFU",
  description: "Manage bookings and availability for Casa STFU.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
