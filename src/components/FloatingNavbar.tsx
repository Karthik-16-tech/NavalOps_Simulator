import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Ship, Crosshair, Search, Anchor, LogOut, Glasses } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/explorer", icon: Ship, label: "Ship Explorer" },
  { to: "/weapons", icon: Crosshair, label: "Weapons" },
  { to: "/analysis", icon: Search, label: "Components" },
  { to: "/augmented-reality", icon: Glasses, label: "AR" },
];

export default function FloatingNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-4 left-[22%] z-50"
    >
      <div className="flex items-center gap-1 px-2 py-2 rounded-xl bg-secondary/70 backdrop-blur-2xl border border-border/50 shadow-lg shadow-background/50">
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2 px-3 py-2 mr-1 text-foreground hover:text-primary transition-colors"
        >
          <Anchor className="w-4 h-4 text-primary" />
          <span className="font-display text-xs font-semibold tracking-wide hidden sm:inline">
            IN NAVY
          </span>
        </NavLink>

        <div className="w-px h-5 bg-border/50 mr-1" />

        {/* Nav Items */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-body font-medium tracking-wide transition-all duration-200",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </>
            )}
          </NavLink>
        ))}

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-body font-medium tracking-wide text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </motion.nav>
  );
}
