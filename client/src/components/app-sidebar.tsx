import {
  Users,
  FileText,
  ShoppingCart,
  Tag,
  Box,
  Settings,
  ChefHat,
  Map,
  BarChart2,
  LayoutDashboard,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { Link, useNavigate, useLocation } from "react-router";
import { useGetSettingsQuery } from "@/services/SettingsApi";

export function AppSidebar() {
  const { role } = useSelector((state: RootState) => state.user);
  const location = useLocation();

  const baseItems = [
    { title: "DASHBOARD", url: "/dashboard", icon: LayoutDashboard },
    { title: "POS / PLACE ORDER", url: "/dashboard/pos", icon: ShoppingCart },
    { title: "KITCHEN DISPLAY", url: "/dashboard/kitchen", icon: ChefHat },
    { title: "FLOOR & TABLES", url: "/dashboard/floor", icon: Map },
    { title: "ORDERS HISTORY", url: "/dashboard/orders", icon: FileText },
  ];

  const adminItems = [
    { title: "ANALYTICS", url: "/dashboard/analytics", icon: BarChart2 },
    { title: "MENU ITEMS", url: "/dashboard/menu", icon: Box },
    { title: "CATEGORIES", url: "/dashboard/categories", icon: Tag },
    { title: "STAFF", url: "/dashboard/staff", icon: Users },
    { title: "REPORTS", url: "/dashboard/reports", icon: FileText },
    { title: "SETTINGS", url: "/dashboard/settings", icon: Settings },
  ];

  const items = role === "admin" ? [...baseItems, ...adminItems] : baseItems;
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading } = useGetSettingsQuery({});
  const businessName = data?.data?.businessName || "ODOO POS CAFE";

  const handleLogout = () => {
    dispatch({ type: "user/logout" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Sidebar className="border-none">
      <SidebarContent className="bg-deep-black text-warm-white px-2 sm:px-4">
        <div className="flex items-center gap-3 px-6 py-8 h-28 bg-deep-black border-b border-golden-yellow/20">
          <div className="w-14 h-14 bg-white p-1 border-2 border-golden-yellow shadow-[4px_4px_0px_0px_#F5B400]">
            <img
              src="/logo.png"
              alt="Cafe Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[8px] tracking-[0.3em] text-golden-yellow uppercase leading-none mb-2">
              Terminal_Sync
            </span>
            <span className="font-heading font-black text-2xl text-warm-white tracking-tighter uppercase leading-[0.8]">
              {(!isLoading && businessName) || "ODOO POS CAFE"}
            </span>
          </div>
        </div>

        <SidebarGroup className="p-6">
          <SidebarGroupLabel className="text-[10px] font-mono font-black text-golden-yellow uppercase tracking-[0.2em] mb-8">
            [ NAVIGATION_SYSTEM ]
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`group flex items-center gap-4 px-4 py-3 transition-all duration-75 border-none rounded-none ${
                          isActive 
                            ? "text-golden-yellow bg-white/5" 
                            : "text-warm-white hover:text-golden-yellow"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
                        <span className="font-heading font-black uppercase text-base tracking-tight italic">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>

          <button
            className="mt-16 w-full bg-[#E11D48] hover:bg-red-700 text-white font-heading font-black uppercase py-5 text-xl italic tracking-tighter shadow-[6px_6px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all border-2 border-deep-black"
            onClick={handleLogout}
          >
            SYSTEM_LOGOUT
          </button>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
