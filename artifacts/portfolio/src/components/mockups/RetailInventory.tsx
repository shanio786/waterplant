import React from 'react';
import { Package, TrendingUp, AlertOctagon, BarChart3, Settings, ShoppingCart, Truck, Search, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const topProducts = [
  { name: 'Basmati Rice 5kg', sales: 450 },
  { name: 'Cooking Oil 3L', sales: 380 },
  { name: 'Wheat Flour 10kg', sales: 310 },
  { name: 'Sugar 5kg', sales: 290 },
  { name: 'Tea 1kg', sales: 240 },
];

const productsData = [
  { id: 'PRD-102', name: 'National Basmati Rice', category: 'Grocery', stock: 45, sold: 120, reorder: 20, status: 'In Stock' },
  { id: 'PRD-103', name: 'Dalda Cooking Oil', category: 'Grocery', stock: 12, sold: 340, reorder: 30, status: 'Low Stock' },
  { id: 'PRD-104', name: 'Lipton Yellow Label', category: 'Beverages', stock: 85, sold: 210, reorder: 25, status: 'In Stock' },
  { id: 'PRD-105', name: 'Surf Excel Danedar', category: 'Cleaning', stock: 5, sold: 150, reorder: 15, status: 'Critical' },
  { id: 'PRD-106', name: 'Nestle Milkpak 1L', category: 'Dairy', stock: 140, sold: 450, reorder: 50, status: 'In Stock' },
];

export default function RetailInventory() {
  return (
    <div className="flex h-[800px] w-full min-w-[1280px] bg-[#f3f4f6] overflow-hidden rounded-xl border border-slate-300 shadow-2xl text-slate-800 font-sans relative">
      {/* Sidebar */}
      <div className="w-64 bg-[#111827] text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-red-600 p-2.5 rounded-lg shadow-lg shadow-red-600/30">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">StockMaster</h1>
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">Retail POS</p>
          </div>
        </div>
        
        <div className="px-4 py-2 mt-4 space-y-1 flex-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 px-3">Main Menu</p>
          
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-600 text-white rounded-md font-semibold transition-colors shadow-md">
            <BarChart3 className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md font-medium transition-colors">
            <Package className="w-5 h-5" /> Products
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md font-medium transition-colors">
            <AlertOctagon className="w-5 h-5" /> Stock Alerts
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md font-medium transition-colors">
            <TrendingUp className="w-5 h-5" /> Sales
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md font-medium transition-colors">
            <Truck className="w-5 h-5" /> Suppliers
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md font-medium transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Barcode scanner ready..." 
              className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm w-96 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors font-mono"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> LIVE POS
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* Stats Header */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg border-l-4 border-l-slate-800 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Products</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">342</h3>
            </div>
            <div className="bg-white p-5 rounded-lg border-l-4 border-l-amber-500 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Low Stock Alerts</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">18</h3>
            </div>
            <div className="bg-white p-5 rounded-lg border-l-4 border-l-emerald-500 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Today's Sales</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">Rs. 51,200</h3>
            </div>
            <div className="bg-white p-5 rounded-lg border-l-4 border-l-red-600 shadow-sm">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Monthly Revenue</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">Rs. 1.28M</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Inventory Table */}
            <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Inventory Status</h3>
                <button className="text-red-600 text-sm font-bold hover:underline">Manage Stock</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Product</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase text-right">In Stock</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase text-right">Sold</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase text-right">Reorder Level</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {productsData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{item.category}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{item.stock}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.sold}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{item.reorder}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                            item.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700 animate-pulse'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Cash Register Summary */}
              <div className="bg-[#111827] text-white rounded-lg border border-slate-800 shadow-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <BanknoteIcon className="w-5 h-5 text-red-500" /> Cash Register
                </h3>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end border-b border-slate-700 pb-3">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cash in Hand</p>
                      <p className="text-2xl font-black text-white mt-1">Rs. 18,500</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end pb-1">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Card/Digital</p>
                      <p className="text-xl font-bold text-slate-200 mt-1">Rs. 32,700</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t border-slate-700">
                    <p className="text-sm font-bold text-slate-300">Today's Transactions</p>
                    <p className="text-sm font-bold text-red-400">142</p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4 text-sm">Top Selling Products</h3>
                <div className="flex-1 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} width={110} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="sales" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

function BanknoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
