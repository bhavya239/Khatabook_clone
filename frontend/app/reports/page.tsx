'use client';
import { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '@/lib/api';
import { ProfitLossResponse } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [data, setData] = useState<ProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'all' | 'personal' | 'business'>('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getProfitLoss(mode !== 'all' ? mode : undefined);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-gray-400 p-6 flex justify-center">Loading P&L Data...</div>;
  if (!data) return <div className="text-red-400 p-6">Failed to load reports.</div>;

  const isProfit = data.profit >= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Profit & Loss Dashboard</h1>
          <p className="text-gray-400 text-sm">Financial analytics and category breakdown</p>
        </div>
        
        {/* Business Dashboard mode toggle */}
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
          {(['all', 'personal', 'business'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-300 ${
                mode === m 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 relative z-10">Total Income (Received)</p>
          <p className="text-3xl font-bold text-green-400 relative z-10">+{fmt(data.totalIncome)}</p>
        </div>
        <div className="glass p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 relative z-10">Total Expense (Given)</p>
          <p className="text-3xl font-bold text-rose-400 relative z-10">-{fmt(data.totalExpense)}</p>
        </div>
        <div className={`glass p-6 border relative overflow-hidden ${isProfit ? 'border-green-500/30' : 'border-rose-500/30'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl ${isProfit ? 'bg-green-500/10' : 'bg-rose-500/10'}`}></div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 relative z-10">Net Profit/Loss</p>
          <p className={`text-4xl font-bold relative z-10 ${isProfit ? 'text-green-400' : 'text-rose-400'}`}>
            {isProfit ? '+' : '-'}{fmt(data.profit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Monthly Revenue Trend</h2>
          <div className="h-[300px] w-full">
            {data.monthlyBreakdown.length === 0 ? (
               <div className="h-full flex items-center justify-center text-gray-500 text-sm">No historical data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500 }}
                  />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke={isProfit ? '#34d399' : '#fb7185'} strokeWidth={4} dot={{ r: 4, fill: '#111827', strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="expense" name="Expense" stroke="#f87171" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Expense Categories</h2>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
             {data.categoryBreakdown.length === 0 ? (
               <div className="text-gray-500 text-sm">No categorical breakdown found.</div>
             ) : (
               <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                      formatter={(value: any) => [`${fmt(Number(value) || 0)}`, 'Volume']}
                    />
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="flex flex-wrap gap-4 justify-center mt-4 w-full px-4">
                  {data.categoryBreakdown.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span className="capitalize font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
