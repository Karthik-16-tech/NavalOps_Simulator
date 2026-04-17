import { Outlet } from "react-router-dom";
import FloatingNavbar from "@/components/FloatingNavbar";

export default function SimulationLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      <FloatingNavbar />
      <Outlet />
    </div>
  );
}
