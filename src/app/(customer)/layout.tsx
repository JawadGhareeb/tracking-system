import { CustomerSiteHeader } from "@/components/customer-site-header";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--white-100)]">
      <CustomerSiteHeader />
      {children}
    </div>
  );
}
