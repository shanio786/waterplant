import React from 'react';
import { Grid, UtensilsCrossed, FileText, Settings, Clock, Coffee, Plus, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const tables = [
  { id: 'T1', status: 'occupied', guests: 4, time: '45m', amount: 3450 },
  { id: 'T2', status: 'free', guests: 0, time: '', amount: 0 },
  { id: 'T3', status: 'occupied', guests: 2, time: '12m', amount: 1200 },
  { id: 'T4', status: 'cleaning', guests: 0, time: '', amount: 0 },
  { id: 'T5', status: 'occupied', guests: 6, time: '1h 20m', amount: 8900 },
  { id: 'T6', status: 'free', guests: 0, time: '', amount: 0 },
  { id: 'T7', status: 'reserved', guests: 0, time: '8:00 PM', amount: 0 },
  { id: 'T8', status: 'free', guests: 0, time: '', amount: 0 },
  { id: 'T9', status: 'occupied', guests: 3, time: '5m', amount: 450 },
];

const hourlyRevenue = [
  { time: '12 PM', rev: 1200 },
  { time: '1 PM', rev: 3400 },
  { time: '2 PM', rev: 4500 },
  { time: '3 PM', rev: 2100 },
  { time: '4 PM', rev: 1500 },
  { time: '5 PM', rev: 2800 },
  { time: '6 PM', rev: 5600 },
];

export default function RestaurantBilling() {
  return (
    <div className="flex h-[800px] w-full min-w-[1280px] bg-[#0f172a] overflow-hidden rounded-xl border border-slate-700 shadow-2xl text-slate-300 font-sans relative">
      {/* Sidebar */}
      <div className="w-20 bg-[#1e293b] border-r border-slate-700/50 flex flex-col items-center py-6 flex-shrink-0 z-10">
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 mb-8 shadow-lg shadow-amber-500/20">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        
        <div className="flex-1 w-full flex flex-col gap-4 px-3">
          <button className="w-full aspect-square bg-[#0f172a] text-amber-500 rounded-xl flex flex-col items-center justify-center gap-1 border border-amber-500/30 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full"></div>
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Tables</span>
          </button>
          <button className="w-full aspect-square text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Orders</span>
          </button>
          <button className="w-full aspect-square text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
            <Coffee className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
          <button className="w-full aspect-square text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
            <BarChart className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reports</span>
          </button>
        </div>

        <button className="w-12 h-12 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl flex items-center justify-center transition-colors mt-auto">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 border-b border-slate-800/80 flex items-center justify-between px-8 flex-shrink-0 bg-[#0f172a]/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">DineMaster Pro</h2>
            <p className="text-slate-400 text-sm">Table Management</p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Tables</p>
                <p className="text-lg font-bold text-slate-200">8<span className="text-slate-500 text-sm">/24</span></p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Today's Revenue</p>
                <p className="text-lg font-bold text-amber-500">Rs. 28,500</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Orders</p>
                <p className="text-lg font-bold text-slate-200">64</p>
              </div>
            </div>
            
            <div className="w-px h-10 bg-slate-800"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-200">Kashif</p>
                <p className="text-xs text-amber-500">Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-sm font-bold">
                K
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 flex gap-6 overflow-hidden">
          
          {/* Left Panel: Table Grid & Chart */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 bg-[#1e293b] p-1 rounded-lg border border-slate-800">
                <button className="px-4 py-1.5 text-sm font-medium bg-[#0f172a] text-amber-500 rounded shadow-sm">Main Hall</button>
                <button className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200">Terrace</button>
                <button className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200">Family Hall</button>
              </div>
              
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Occupied</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Free</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Reserved</div>
              </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-3 gap-4 auto-rows-max overflow-y-auto pr-2 pb-4">
              {tables.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-4 rounded-xl border relative cursor-pointer transition-all ${
                    t.status === 'occupied' ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' :
                    t.status === 'reserved' ? 'bg-blue-500/5 border-blue-500/20' :
                    t.status === 'cleaning' ? 'bg-orange-500/5 border-orange-500/20 opacity-60' :
                    'bg-[#1e293b] border-slate-700 hover:border-slate-500'
                  } ${t.id === 'T5' ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#0f172a]' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-xl font-bold ${t.status === 'occupied' ? 'text-amber-500' : 'text-slate-300'}`}>{t.id}</h3>
                    {t.guests > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium bg-black/30 px-2 py-1 rounded text-slate-300">
                        <UsersIcon className="w-3 h-3" /> {t.guests}
                      </span>
                    )}
                  </div>
                  
                  {t.status === 'occupied' ? (
                    <div>
                      <p className="text-2xl font-bold text-slate-100 mb-1">Rs. {t.amount}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t.time}
                      </p>
                    </div>
                  ) : t.status === 'reserved' ? (
                    <div className="flex items-center justify-center h-12 text-blue-400 font-medium text-sm">
                      Reserved for {t.time}
                    </div>
                  ) : t.status === 'cleaning' ? (
                    <div className="flex items-center justify-center h-12 text-orange-400 font-medium text-sm">
                      Cleaning in progress
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-12 text-slate-500 font-medium text-sm">
                      Available
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mini Chart */}
            <div className="mt-auto bg-[#1e293b] border border-slate-800 rounded-xl p-4 h-48 flex flex-col">
              <h4 className="text-sm font-bold text-slate-300 mb-4">Revenue by Hour</h4>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#334155' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Bar dataKey="rev" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Panel: Active Order Details */}
          <div className="w-[360px] bg-[#1e293b] rounded-xl border border-slate-700 flex flex-col shadow-xl">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-slate-100">Table T5</h3>
                <p className="text-sm text-amber-500 font-medium">Order #4092</p>
              </div>
              <div className="bg-[#0f172a] px-3 py-1 rounded-lg border border-slate-700">
                <span className="text-sm font-bold text-slate-300">1h 20m</span>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-xs font-bold">1</span>
                    <p className="font-bold text-slate-200">Chicken Karahi (Half)</p>
                  </div>
                  <p className="text-xs text-slate-500 ml-7">Extra spicy, with bone</p>
                </div>
                <p className="font-bold text-slate-300">1,200</p>
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-xs font-bold">2</span>
                    <p className="font-bold text-slate-200">Chicken Tikka Pizza</p>
                  </div>
                  <p className="text-xs text-slate-500 ml-7">Large</p>
                </div>
                <p className="font-bold text-slate-300">3,400</p>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-xs font-bold">1</span>
                    <p className="font-bold text-slate-200">Mutton Seekh Kabab</p>
                  </div>
                  <p className="text-xs text-slate-500 ml-7">1 Dozen</p>
                </div>
                <p className="font-bold text-slate-300">2,800</p>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-xs font-bold">6</span>
                    <p className="font-bold text-slate-200">Garlic Naan</p>
                  </div>
                </div>
                <p className="font-bold text-slate-300">600</p>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-xs font-bold">4</span>
                    <p className="font-bold text-slate-200">Mint Margarita</p>
                  </div>
                </div>
                <p className="font-bold text-slate-300">900</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-700 bg-slate-800/30">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>Rs. 8,900</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>GST (5%)</span>
                  <span>Rs. 445</span>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-700/50 flex justify-between items-center">
                  <span className="text-slate-300 font-bold uppercase tracking-wider text-sm">Total</span>
                  <span className="text-3xl font-black text-amber-500">Rs. 9,345</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button className="py-3 bg-[#0f172a] border border-slate-600 hover:bg-slate-800 rounded-lg font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors">
                  <FileText className="w-4 h-4" /> Print Bill
                </button>
                <button className="py-3 bg-amber-500 hover:bg-amber-400 rounded-lg font-bold text-slate-900 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20">
                  Pay & Clear <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
