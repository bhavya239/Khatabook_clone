'use client';
import { useState, useEffect } from 'react';
import { transactionAPI } from '@/lib/api';
import { SummaryResponse } from '@/lib/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

export default function ReportsPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear]   = useState(() => new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    transactionAPI.getSummary({ month, year })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const s = data?.summary;
  
  // Chart Data
  const chartData = [
    { name: 'Given (Owed to you)', amount: s?.totalGiven || 0, color: '#f87171' }, // red-400
    { name: 'Received (You owe / paid)', amount: s?.totalReceived || 0, color: '#4ade80' } // green-400
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Report</h1>
          <p className="text-gray-400 text-sm">Visual overview of your cash flow</p>
        </div>
        
        {/* Month Picker */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1 w-max">
          <select 
            value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-white px-2 py-1 text-sm focus:outline-none"
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1} className="bg-gray-900">
                {new Date(0, i).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>
          <span className="text-gray-600">|</span>
          <select 
            value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-white px-2 py-1 text-sm focus:outline-none"
          >
            {[year-1, year, year+1].map(y => (
              <option key={y} value={y} className="bg-gray-900">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 glass">Generating report…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart Section */}
          <div className="glass p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Cash Flow</h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    cursor={{fill: '#1f2937'}} 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                    formatter={(val: any) => [fmt(Number(val)), 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-4">
              <span className="text-gray-400">Net Flow:</span>
              <span className={`text-xl font-bold ${(s?.netBalance || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(s?.netBalance || 0) >= 0 ? '+' : '-'}{fmt(s?.netBalance || 0)}
              </span>
            </div>
          </div>

          {/* Contact Balances Section */}
          <div className="glass p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Pending Balances</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {data?.contactBalances.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">No active balances this month.</p>
              ) : (
                data?.contactBalances.map(c => (
                  <div key={c._id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-white font-medium">{c.name}</p>
                    <div className="text-right">
                      <p className={`font-bold ${c.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {c.balance >= 0 ? '+' : '-'}{fmt(c.balance)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.balance >= 0 ? 'They owe you' : 'You owe them'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
