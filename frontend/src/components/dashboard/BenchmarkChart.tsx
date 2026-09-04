import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DistrictBenchmark } from '../../types/schemas';

interface BenchmarkChartProps {
  benchmark: DistrictBenchmark;
}

export default function BenchmarkChart({ benchmark }: BenchmarkChartProps) {
  const chartData = [
    {
      metric: 'Approval Rate (%)',
      District: benchmark.districtMetrics.approvalRate,
      'State Avg': benchmark.stateAvg.approvalRate,
    },
    {
      metric: 'Rejection Rate (%)',
      District: benchmark.districtMetrics.rejectionRate,
      'State Avg': benchmark.stateAvg.rejectionRate,
    },
    {
      metric: 'Pending Rate (%)',
      District: benchmark.districtMetrics.pendingRate,
      'State Avg': benchmark.stateAvg.pendingRate,
    },
    {
      metric: 'High Risk Claims (%)',
      District: benchmark.districtMetrics.highRiskClaimsPercentage,
      'State Avg': benchmark.stateAvg.highRiskClaimsPercentage,
    },
  ];

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            District vs State Benchmarking
          </h3>
          <p className="text-[11px] text-slate-500">
            Comparing <strong className="text-slate-800">{benchmark.districtName}</strong> against State Mean Metrics
          </p>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="District" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="State Avg" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Benchmark Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <th className="p-2.5">Metric</th>
              <th className="p-2.5">{benchmark.districtName} District</th>
              <th className="p-2.5">State Average</th>
              <th className="p-2.5">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">Approval Rate</td>
              <td className="p-2.5 font-bold">{benchmark.districtMetrics.approvalRate}%</td>
              <td className="p-2.5">{benchmark.stateAvg.approvalRate}%</td>
              <td className={`p-2.5 font-bold ${benchmark.differences.approvalRateDiff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {benchmark.differences.approvalRateDiff > 0 ? '+' : ''}{benchmark.differences.approvalRateDiff}%
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">Rejection Rate</td>
              <td className="p-2.5 font-bold">{benchmark.districtMetrics.rejectionRate}%</td>
              <td className="p-2.5">{benchmark.stateAvg.rejectionRate}%</td>
              <td className={`p-2.5 font-bold ${benchmark.differences.rejectionRateDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {benchmark.differences.rejectionRateDiff > 0 ? '+' : ''}{benchmark.differences.rejectionRateDiff}%
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">Avg Processing Time</td>
              <td className="p-2.5 font-bold">{benchmark.districtMetrics.avgProcessingTimeDays} days</td>
              <td className="p-2.5">{benchmark.stateAvg.avgProcessingTimeDays} days</td>
              <td className={`p-2.5 font-bold ${benchmark.differences.avgProcessingTimeDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {benchmark.differences.avgProcessingTimeDiff > 0 ? '+' : ''}{benchmark.differences.avgProcessingTimeDiff} days
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
