import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ship,
  Crosshair,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Ship, label: "Ship Explorer" },
  { to: "/weapons", icon: Crosshair, label: "Weapons & Systems" },
  { to: "/analysis", icon: Search, label: "Component Analysis" },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background grid-overlay">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-border bg-navy-deep/95 backdrop-blur-xl"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <h1 className="font-display text-xs font-bold tracking-wider text-primary glow-text-cyan">
                  NAVAL SIM
                </h1>
                <p className="text-[10px] text-muted-foreground font-mono">
                  IN NAVY • AR/VR
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Status */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="status-dot-active" />
            {!collapsed && (
              <span className="text-xs font-mono text-accent">SYSTEM ONLINE</span>
            )}
          </div>
          {!collapsed && (
            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>FPS: 60 | LAT: 12ms</span>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 min-h-screen"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
