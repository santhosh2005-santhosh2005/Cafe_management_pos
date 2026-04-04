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
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { useGetSettingsQuery } from "@/services/SettingsApi";

export function AppSidebar() {
  const { role } = useSelector((state: RootState) => state.user);

  const baseItems = [
    { title: "POS / Place Order", url: "/dashboard/pos", icon: ShoppingCart },
    { title: "Floor & Tables", url: "/dashboard/floor", icon: Map },
    { title: "Orders History", url: "/dashboard/orders", icon: FileText },
  ];

  const adminItems = [
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart2 },
    { title: "Kitchen Display", url: "/dashboard/kitchen", icon: ChefHat },
    { title: "Menu Items", url: "/dashboard/menu", icon: Box },
    { title: "Categories", url: "/dashboard/categories", icon: Tag },
    { title: "Staff", url: "/dashboard/staff", icon: Users },
    { title: "Reports", url: "/dashboard/reports", icon: FileText },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  const items = role === "admin" ? [...baseItems, ...adminItems] : baseItems;
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading } = useGetSettingsQuery({});
  const businessName = data?.data?.businessName || "CAFE";

  const handleLogout = () => {
    dispatch({ type: "user/logout" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  // if (isLoading) {
  //   return (
  //     <Sidebar>
  //       <SidebarContent className="bg-gray-50 dark:bg-gray-900">
  //         <div className="flex items-center gap-3 px-6 py-5 h-20 border-b dark:border-gray-800">
  //           <Coffee className="h-8 w-8 text-blue-600 dark:text-blue-400" />
  //           <span className="font-extrabold text-2xl text-gray-900 dark:text-gray-100 tracking-wide">
  //             Loading...
  //           </span>
  //         </div>
  //       </SidebarContent>
  //     </Sidebar>
  //   );
  // }
  return (
    <Sidebar className="border-r-2 border-deep-black">
      <SidebarContent className="bg-deep-black text-warm-white px-2 sm:px-4">
        <div className="flex items-center gap-3 px-6 py-5 h-24 border-b-2 border-golden-yellow/30 bg-deep-black">
          <img
            src="/logo.png"
            alt="Cafe Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-golden-yellow p-0.5"
          />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.2em] text-golden-yellow uppercase leading-none mb-1">
              Terminal_Sync
            </span>
            <span className="font-sans font-black text-xl sm:text-2xl text-warm-white tracking-tighter uppercase leading-none">
              {(!isLoading && businessName) || "CAFE"}
            </span>
          </div>
        </div>

        <SidebarGroup className="p-4">
          <SidebarGroupLabel className="text-xs font-mono font-bold text-golden-yellow/50 uppercase tracking-widest mb-4">
            [ NAVIGATION_SYSTEM ]
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className="group flex items-center gap-3 px-4 py-3 text-warm-white hover:bg-golden-yellow hover:text-deep-black transition-all duration-75 border-b-0 border-transparent active:scale-[0.98]"
                    >
                      <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="font-sans font-black uppercase text-sm tracking-tight">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

          <button
            className="mt-10 w-full bg-red-600 hover:bg-red-700 text-white font-sans font-black uppercase py-4 border-2 border-black active:translate-y-1 transition-all"
            onClick={handleLogout}
          >
            SYSTEM_LOGOUT
          </button>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
