import { ModeToggle } from "@/components/mode-toggle";
import { Link, useLocation } from "react-router";

export default function MainNavbar() {
  const location = useLocation();
  const showNavbar = ["/", "/login"].includes(location.pathname.toLowerCase());

  if (!showNavbar) return null; // Hide navbar on other routes

  return (
    <header className="w-full border-b-4 border-deep-black bg-warm-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Brand */}
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Odoo Logo" className="w-12 h-12 border-2 border-deep-black p-1 bg-white" />
            <Link
              to="/"
              className="text-2xl font-black italic tracking-tighter text-deep-black uppercase"
            >
              Odoo POS <span className="text-golden-yellow">Cafe</span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link to="/login" className="brutalist-button h-10 px-6 text-sm flex items-center justify-center">
               CORE_LOGIN
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
