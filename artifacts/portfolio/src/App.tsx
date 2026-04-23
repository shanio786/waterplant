import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import WaterPlantManager from "@/components/mockups/WaterPlantManager";
import PharmacyPOS from "@/components/mockups/PharmacyPOS";
import RestaurantBilling from "@/components/mockups/RestaurantBilling";
import SchoolManagement from "@/components/mockups/SchoolManagement";
import RetailInventory from "@/components/mockups/RetailInventory";

import { MonitorSmartphone, Code2, Phone } from "lucide-react";

const queryClient = new QueryClient();

function Portfolio() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans w-full min-w-[1280px]">
      {/* Hero Section */}
      <header className="bg-slate-900 text-white py-20 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4 text-white">Devoria Tech</h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl font-light">
            Custom Software for Every Industry. We build authoritative, high-performance desktop management systems for SMEs in Pakistan.
          </p>
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-6 py-3 shadow-lg">
            <Phone className="w-5 h-5 text-blue-400" />
            <span className="font-mono font-bold text-slate-200">+92 311 7597815</span>
          </div>
        </div>
      </header>

      {/* Main Content: The Mockups */}
      <main className="py-16 px-8 max-w-[1440px] mx-auto flex flex-col gap-24">
        
        {/* Project 1 */}
        <section className="mockup-print-page">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#0d7377]/10 text-[#0d7377] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Manufacturing & Distribution</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">Water Plant Manager</h2>
              <p className="text-slate-500 font-medium mt-1">Complete supply chain, cylinder tracking, and customer invoicing.</p>
            </div>
            <div className="text-right">
              <MonitorSmartphone className="w-8 h-8 text-slate-300 ml-auto mb-2" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Desktop App</p>
            </div>
          </div>
          <WaterPlantManager />
        </section>

        {/* Project 2 */}
        <section className="mockup-print-page">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Healthcare & Retail</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">Pharmacy POS</h2>
              <p className="text-slate-500 font-medium mt-1">Expiry tracking, batch management, and lightning-fast checkout.</p>
            </div>
            <div className="text-right">
              <MonitorSmartphone className="w-8 h-8 text-slate-300 ml-auto mb-2" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Desktop App</p>
            </div>
          </div>
          <PharmacyPOS />
        </section>

        {/* Project 3 */}
        <section className="mockup-print-page">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Hospitality</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">Restaurant Billing System</h2>
              <p className="text-slate-500 font-medium mt-1">Visual table management, kitchen order tickets, and shift closing.</p>
            </div>
            <div className="text-right">
              <MonitorSmartphone className="w-8 h-8 text-slate-300 ml-auto mb-2" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Desktop App</p>
            </div>
          </div>
          <RestaurantBilling />
        </section>

        {/* Project 4 */}
        <section className="mockup-print-page">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Education</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">School Management System</h2>
              <p className="text-slate-500 font-medium mt-1">Fee collection, attendance tracking, and academic scheduling.</p>
            </div>
            <div className="text-right">
              <MonitorSmartphone className="w-8 h-8 text-slate-300 ml-auto mb-2" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Desktop App</p>
            </div>
          </div>
          <SchoolManagement />
        </section>

        {/* Project 5 */}
        <section className="mockup-print-page">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">General Retail</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">Inventory Management</h2>
              <p className="text-slate-500 font-medium mt-1">Barcode scanning, stock alerts, and comprehensive sales reporting.</p>
            </div>
            <div className="text-right">
              <MonitorSmartphone className="w-8 h-8 text-slate-300 ml-auto mb-2" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Desktop App</p>
            </div>
          </div>
          <RetailInventory />
        </section>

      </main>
      
      <footer className="bg-slate-900 py-12 text-center text-slate-400 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <Code2 className="w-8 h-8 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">Devoria Tech</h3>
          <p className="text-sm mb-6">Building software that powers Pakistani businesses.</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <span>+92 311 7597815</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>contact@devoriatech.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Portfolio} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
