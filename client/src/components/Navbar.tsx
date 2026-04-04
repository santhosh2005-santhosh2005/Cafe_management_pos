import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "./ui/avatar";

export default function Navbar() {
  const { role, name } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch({ type: "user/logout" });
    navigate("/login");
  };

  return (
    <nav className="w-full border-b-2 border-deep-black bg-warm-white h-24">
      <div className="max-w-full mx-auto px-6 sm:px-10 h-full pt-1">
        <div className="flex items-center justify-between h-full">
          {/* Sidebar Trigger */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="p-3 border-2 border-deep-black bg-warm-white hover:bg-golden-yellow transition-all active:translate-y-1 transition-colors" />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-6">
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-4 cursor-pointer group">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-tighter leading-none mb-1">
                      {role || "OPERATOR"}
                    </span>
                    <span className="text-lg font-sans font-black text-deep-black uppercase leading-none tracking-tight group-hover:text-golden-yellow transition-colors">
                      {name || "ADMIN"}
                    </span>
                  </div>
                  <Avatar className="h-12 w-12 border-2 border-deep-black shadow-[4px_4px_0px_0px_#0A0A0A] group-hover:shadow-none transition-all rounded-none">
                    <AvatarFallback className="bg-golden-yellow text-deep-black font-black text-xl rounded-none">
                      {name?.slice(0, 2).toUpperCase() || "AD"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64 bg-white border-2 border-deep-black shadow-[8px_8px_0px_0px_#0A0A0A] p-2 mt-4 mr-4 rounded-none">
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2 px-3">System_Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-deep-black/10" />
                <DropdownMenuItem
                  className="font-sans font-black uppercase text-sm py-4 px-4 hover:bg-golden-yellow focus:bg-golden-yellow transition-colors cursor-pointer rounded-none"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  [ VIEW_PROFILE ]
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="font-sans font-black uppercase text-sm py-4 px-4 hover:bg-golden-yellow focus:bg-golden-yellow transition-colors cursor-pointer rounded-none"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  [ SYSTEM_SETTINGS ]
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-deep-black/10" />
                <DropdownMenuItem 
                  className="font-sans font-black uppercase text-sm py-4 px-4 bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 transition-colors cursor-pointer rounded-none"
                  onClick={handleLogout}
                >
                  EXECUTE_LOGOUT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
