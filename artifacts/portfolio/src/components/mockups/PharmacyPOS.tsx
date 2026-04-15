import React from 'react';
import { LayoutDashboard, Package, Receipt, Truck, FileBarChart, Search, LogOut, Plus, AlertTriangle } from 'lucide-react';

const inventoryData = [
  { id: 'MED-001', name: 'Panadol Extra 500mg', category: 'Painkillers', stock: 1240, expiry: '2025-10', price: 450, status: 'Good' },
  { id: 'MED-002', name: 'Augmentin 500mg', category: 'Antibiotics', stock: 8, expiry: '2024-05', price: 220, status: 'Low Stock' },
  { id: 'MED-003', name: 'Arinac 600mg', category: 'Antibiotics', stock: 45, expiry: '2024-12', price: 850, status: 'Good' },
  { id: 'MED-004', name: 'Flagyl 375mg', category: 'Antibiotics', stock: 120, expiry: '2025-02', price: 150, status: 'Good' },
  { id: 'MED-005', name: 'Brufen 400mg', category: 'Painkillers', stock: 3, expiry: '2024-04', price: 90, status: 'Critical' },
  { id: 'MED-006', name: 'Surbex Z', category: 'Vitamins', stock: 200, expiry: '2026-01', price: 600, status: 'Good' },
];

const billingItems = [
  { name: 'Panadol Extra 500mg', qty: 2, price: 450, total: 900 },
  { name: 'Surbex Z', qty: 1, price: 600, total: 600 },
  { name: 'Bandages Pack', qty: 1, price: 120, total: 120 },
];

export default function PharmacyPOS() {
  const subtotal = 1620;
  const discount = 120;
  const total = subtotal - discount;

  return (
    <div className="flex h-[800px] w-full min-w-[1280px] bg-white overflow-hidden rounded-xl border shadow-xl text-slate-800 font-sans relative">
      {/* Sidebar */}
      <div className="w-[260px] bg-[#059669] text-white flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-emerald-700/50">
          <div className="bg-white p-2 rounded-lg text-emerald-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">MediCare POS</h1>
            <p className="text-emerald-100 text-xs">Pharmacy Management</p>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-emerald-50 hover:bg-emerald-700/50 hover:text-white rounded-lg font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-emerald-700 rounded-lg font-bold shadow-sm transition-colors">
            <Package className="w-5 h-5" /> Inventory
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-emerald-50 hover:bg-emerald-700/50 hover:text-white rounded-lg font-medium transition-colors">
            <Receipt className="w-5 h-5" /> Billing POS
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-emerald-50 hover:bg-emerald-700/50 hover:text-white rounded-lg font-medium transition-colors">
            <Truck className="w-5 h-5" /> Suppliers
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-emerald-50 hover:bg-emerald-700/50 hover:text-white rounded-lg font-medium transition-colors">
            <FileBarChart className="w-5 h-5" /> Reports
          </button>
        </div>
        
        <div className="p-4 bg-emerald-800/30 m-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold">DR</div>
            <div>
              <p className="text-sm font-bold">Dr. Salman</p>
              <p className="text-xs text-emerald-200">Pharmacist</p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> End Shift
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800">Inventory Management</h2>
          
          <div className="flex items-center gap-4">
            <button className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors">
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto flex gap-6">
          
          <div className="flex-1 flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Revenue</p>
                <h3 className="text-2xl font-black text-slate-800">Rs. 32,800</h3>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Items Sold</p>
                <h3 className="text-2xl font-black text-slate-800">187</h3>
              </div>
              <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50/50 shadow-sm">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Low Stock Items</p>
                <h3 className="text-2xl font-black text-red-700">12</h3>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Revenue</p>
                <h3 className="text-2xl font-black text-slate-800">Rs. 6.42M</h3>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search medicine name, batch..." 
                    className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>All Categories</option>
                    <option>Antibiotics</option>
                    <option>Painkillers</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Medicine Name</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Category</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Stock</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Expiry</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Price (Rs.)</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {inventoryData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.id}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{item.category}</td>
                        <td className="px-5 py-3.5 font-medium">{item.stock}</td>
                        <td className="px-5 py-3.5 text-slate-600">{item.expiry}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{item.price}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            item.status === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
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
          </div>

          {/* Right Panel - Current Sale */}
          <div className="w-80 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
              <div className="bg-emerald-600 p-4 text-white">
                <h3 className="font-bold text-lg">Current Sale</h3>
                <p className="text-emerald-100 text-xs">Customer: Walk-in</p>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {billingItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.qty} x Rs. {item.price}</p>
                      </div>
                      <p className="font-bold text-sm text-slate-800">Rs. {item.total}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-800">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">- Rs. {discount}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase">Total</span>
                  <span className="font-black text-2xl text-emerald-600">Rs. {total}</span>
                </div>
                <button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-lg shadow-sm transition-colors">
                  Checkout
                </button>
              </div>
            </div>

            {/* Alerts widget */}
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-4">
              <h4 className="font-bold text-red-700 text-sm flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Action Required
              </h4>
              <div className="space-y-2">
                <div className="bg-red-50 p-2 rounded border border-red-100">
                  <p className="text-xs font-semibold text-slate-800">Brufen 400mg</p>
                  <p className="text-[10px] text-red-600">Only 3 remaining in stock</p>
                </div>
                <div className="bg-amber-50 p-2 rounded border border-amber-100">
                  <p className="text-xs font-semibold text-slate-800">Augmentin 500mg</p>
                  <p className="text-[10px] text-amber-600">8 remaining in stock</p>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
