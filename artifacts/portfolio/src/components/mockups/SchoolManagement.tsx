import React from 'react';
import { GraduationCap, Users, Calendar, Banknote, BookOpen, BarChart2, Bell, Search, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

const students = [
  { id: '1042', name: 'Ayesha Tariq', class: '10th Science', roll: '45', feeStatus: 'Paid', attendance: '98%' },
  { id: '1043', name: 'Muhammad Bilal', class: '10th Science', roll: '12', feeStatus: 'Pending', attendance: '85%' },
  { id: '1044', name: 'Zainab Ahmed', class: '9th Arts', roll: '08', feeStatus: 'Paid', attendance: '92%' },
  { id: '1045', name: 'Omar Farooq', class: '8th Section A', roll: '34', feeStatus: 'Overdue', attendance: '74%' },
  { id: '1046', name: 'Fatima Ali', class: '10th Science', roll: '22', feeStatus: 'Paid', attendance: '95%' },
  { id: '1047', name: 'Hassan Raza', class: '9th Science', roll: '18', feeStatus: 'Paid', attendance: '88%' },
];

const attendanceData = [
  { name: '10th Grade', value: 145, color: '#7c3aed' },
  { name: '9th Grade', value: 160, color: '#8b5cf6' },
  { name: '8th Grade', value: 180, color: '#a78bfa' },
  { name: '7th Grade', value: 175, color: '#c4b5fd' },
];

const schedule = [
  { time: '08:00 AM', subject: 'Mathematics', teacher: 'Mr. Khalid', class: '10th Science' },
  { time: '09:00 AM', subject: 'Physics', teacher: 'Ms. Sadia', class: '10th Science' },
  { time: '10:00 AM', subject: 'English', teacher: 'Mr. Imran', class: '9th Arts' },
  { time: '11:30 AM', subject: 'Chemistry', teacher: 'Ms. Amna', class: '9th Science' },
];

export default function SchoolManagement() {
  return (
    <div className="flex h-[800px] w-full min-w-[1280px] bg-[#fdfcff] overflow-hidden rounded-xl border shadow-xl text-slate-800 font-sans relative">
      {/* Sidebar */}
      <div className="w-64 bg-[#7c3aed] text-white flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">EduCore</h1>
            <p className="text-purple-200 text-[11px] font-medium uppercase tracking-widest">School ERP</p>
          </div>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/15 rounded-xl text-white font-medium transition-all shadow-sm">
            <BarChart2 className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-purple-100 hover:bg-white/10 hover:text-white rounded-xl font-medium transition-all">
            <Users className="w-5 h-5" /> Students
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-purple-100 hover:bg-white/10 hover:text-white rounded-xl font-medium transition-all">
            <Calendar className="w-5 h-5" /> Attendance
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-purple-100 hover:bg-white/10 hover:text-white rounded-xl font-medium transition-all">
            <Banknote className="w-5 h-5" /> Fee Collection
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-purple-100 hover:bg-white/10 hover:text-white rounded-xl font-medium transition-all">
            <BookOpen className="w-5 h-5" /> Timetable
          </button>
        </div>
        
        <div className="p-6 mt-auto">
          <div className="bg-purple-800/50 rounded-xl p-4 flex items-center gap-3 border border-purple-600/50">
            <img src="https://ui-avatars.com/api/?name=Principal+Usman&background=fff&color=7c3aed" alt="Profile" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-sm font-bold">Principal Usman</p>
              <p className="text-[10px] text-purple-300">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f5f3ff]/50">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-purple-100 flex items-center justify-between px-8 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Crescent Public School</h2>
            <p className="text-slate-500 text-sm font-medium">Academic Year 2023-2024</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
              <input 
                type="text" 
                placeholder="Search student by roll no or name..." 
                className="pl-11 pr-4 py-2.5 bg-white border border-purple-100 shadow-sm rounded-full text-sm w-72 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>
            <button className="relative p-2.5 bg-white border border-purple-100 rounded-full text-slate-400 hover:text-purple-600 shadow-sm transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm shadow-purple-500/5 relative overflow-hidden">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Students</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">842</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm shadow-purple-500/5 relative overflow-hidden">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Present Today</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">786</h3>
              <p className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 w-max px-2 py-1 rounded-md">93.3% Attendance</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm shadow-purple-500/5 relative overflow-hidden">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <Banknote className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Fee Collected (Oct)</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Rs. 4.28M</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm shadow-purple-500/5 relative overflow-hidden">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-4">
                <AlertTriangleIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Pending Fees</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Rs. 96,500</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Table area */}
            <div className="col-span-2 flex flex-col gap-8">
              <div className="bg-white border border-purple-100 rounded-2xl shadow-sm shadow-purple-500/5 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-purple-50 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800">Recent Student Activities</h3>
                  <button className="text-purple-600 text-sm font-bold flex items-center gap-1 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50 text-sm">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{student.name}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">ID: {student.id} | Roll: {student.roll}</div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{student.class}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${parseInt(student.attendance) > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: student.attendance }}
                                ></div>
                              </div>
                              <span className="font-bold text-slate-700">{student.attendance}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                              student.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              student.feeStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.feeStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Chart & Schedule */}
            <div className="flex flex-col gap-6">
              {/* Chart Area */}
              <div className="bg-white border border-purple-100 rounded-2xl shadow-sm shadow-purple-500/5 p-6 h-[300px] flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 mb-2">Attendance by Grade</h3>
                <div className="flex-1 -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Schedule Area */}
              <div className="bg-white border border-purple-100 rounded-2xl shadow-sm shadow-purple-500/5 p-6 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800">Today's Schedule</h3>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">View Full</span>
                </div>
                
                <div className="relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-purple-200 before:to-transparent">
                  <div className="space-y-6">
                    {schedule.map((item, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-purple-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-purple-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-purple-600">{item.time}</span>
                          </div>
                          <div className="font-bold text-slate-800">{item.subject}</div>
                          <div className="text-xs text-slate-500 font-medium mt-1">{item.teacher} • {item.class}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
