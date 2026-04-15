import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Droplet, LayoutDashboard, FileText, Users, Box, Settings, Bell, Search, LogOut } from 'lucide-react';

const salesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const invoices = [
  { id: 'INV-1024', customer: 'Ali Traders', bottles: 40, amount: 2000, type: 'Cash' },
  { id: 'INV-1025', customer: 'Zain Mart', bottles: 25, amount: 1250, type: 'Credit' },
  { id: 'INV-1026', customer: 'Raza Medical', bottles: 10, amount: 500, type: 'Cash' },
  { id: 'INV-1027', customer: 'City School', bottles: 60, amount: 3000, type: 'Bank Transfer' },
  { id: 'INV-1028', customer: 'Usman Fabrics', bottles: 15, amount: 750, type: 'Cash' },
];

export default function WaterPlantManager() {
  return (
    <div className="flex h-[800px] w-full min-w-[1280px] bg-white overflow-hidden rounded-xl border shadow-xl text-slate-800 font-sans relative">
      {/* Sidebar */}
      <div className="w-64 bg-[#0d7377] text-white flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white/20 p-2 rounded-lg">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">AquaFlow</h1>
            <p className="text-white/70 text-xs">Plant Manager</p>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-white font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <FileText className="w-5 h-5" /> Sales
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <Users className="w-5 h-5" /> Customers
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <Box className="w-5 h-5" /> Inventory
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">AK</div>
            <div>
              <p className="text-sm font-bold">Ahmad Khan</p>
              <p className="text-xs text-white/60">Admin</p>
            </div>
            <LogOut className="w-4 h-4 ml-auto text-white/60 cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Dashboard Overview</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search invoices, customers..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0d7377]/50"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="text-sm text-slate-500 font-medium">
              12 Oct 2023, 10:42 AM
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Low Stock Alert */}
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 shadow-sm">
            <Bell className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-sm">Low Stock Alert: 19L Empty Bottles</p>
              <p className="text-xs text-red-600">Only 45 empty bottles remaining in inventory. Please restock soon.</p>
            </div>
            <button className="ml-auto bg-white px-3 py-1 text-xs font-medium border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors">
              View Inventory
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#0d7377]/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">Today's Sales</p>
              <h3 className="text-2xl font-bold text-slate-800">Rs. 18,400</h3>
              <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                ↑ +12.5% from yesterday
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">Bottles Filled</p>
              <h3 className="text-2xl font-bold text-slate-800">320</h3>
              <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                ↑ +45 from yesterday
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">Outstanding Balance</p>
              <h3 className="text-2xl font-bold text-slate-800">Rs. 74,500</h3>
              <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                From 12 customers
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Customers</p>
              <h3 className="text-2xl font-bold text-slate-800">142</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                3 new this week
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Table area */}
            <div className="col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800">Today's Invoices</h3>
                <button className="text-[#0d7377] text-sm font-semibold hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto flex-1 p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 font-medium">Invoice ID</th>
                      <th className="px-6 py-3 font-medium">Customer</th>
                      <th className="px-6 py-3 font-medium">Bottles</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Payment Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">{inv.id}</td>
                        <td className="px-6 py-4 text-slate-600">{inv.customer}</td>
                        <td className="px-6 py-4 text-slate-600">{inv.bottles}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">Rs. {inv.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            inv.type === 'Cash' ? 'bg-emerald-100 text-emerald-700' :
                            inv.type === 'Credit' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {inv.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Weekly Sales</h3>
                <select className="text-xs border-slate-200 rounded text-slate-500 focus:ring-[#0d7377] focus:border-[#0d7377]">
                  <option>This Week</option>
                  <option>Last Week</option>
                </select>
              </div>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sales" fill="#0d7377" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
