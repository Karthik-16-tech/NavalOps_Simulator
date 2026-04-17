import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import SimulationLayout from "@/components/SimulationLayout";
import ShipExplorer from "@/pages/ShipExplorer";
import WeaponsSystems from "@/pages/WeaponsSystems";
import ComponentAnalysis from "@/pages/ComponentAnalysis";
import AugmentedReality from "@/pages/AugmentedReality";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<SimulationLayout />}>
            <Route path="/explorer" element={<ShipExplorer />} />
            <Route path="/weapons" element={<WeaponsSystems />} />
            <Route path="/analysis" element={<ComponentAnalysis />} />
            <Route path="/augmented-reality" element={<AugmentedReality />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
