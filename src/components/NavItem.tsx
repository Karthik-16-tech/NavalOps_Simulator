import { NavLink as RouterNavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 group relative overflow-hidden",
          isActive
            ? "bg-primary/10 text-primary glow-border-cyan"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="nav-active"
              className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
          {!collapsed && (
            <span className="font-body text-sm font-medium tracking-wide uppercase">
              {label}
            </span>
          )}
        </>
      )}
    </RouterNavLink>
  );
}
