import { AuthGuard } from "@/components/layout/AuthGuard";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <SideNav />
        <div className="lg:ml-56">
          <div className="mx-auto max-w-[2200px] px-4 pb-28 pt-6 lg:px-8 lg:pb-8 2xl:px-10 [@media(min-width:1800px)]:px-12">
            {children}
          </div>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
