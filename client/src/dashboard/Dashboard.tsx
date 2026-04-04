import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import SessionGuard from "@/components/SessionGuard";

export default function Dashboard() {
  return (
    <SidebarProvider className="min-w-full bg-warm-white">
      <div className="flex h-screen min-w-full bg-warm-white">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-warm-white relative">
            {/* Minimal Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#0A0A0A 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="relative z-10 p-8 sm:p-12">
              <SessionGuard>
                <Outlet />
              </SessionGuard>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
