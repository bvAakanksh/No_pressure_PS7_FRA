import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

interface ClaimFlowSankeyProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={payload.color} fillOpacity="0.9" rx={4} />
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        dy=".35em"
        textAnchor={isOut ? 'end' : 'start'}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={600}
      >
        {payload.name}
      </text>
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2 + 14}
        textAnchor={isOut ? 'end' : 'start'}
        fill="#94a3b8"
        fontSize={10}
      >
        {payload.value.toLocaleString()} claims
      </text>
    </g>
  );
};

export default function ClaimFlowSankey({ total, pending, approved, rejected }: ClaimFlowSankeyProps) {
  const processed = approved + rejected;

  // Safeguard against zero data preventing render
  if (total === 0) {
    return <div className="text-slate-400 text-sm italic">No data available for flow chart.</div>;
  }

  const data = {
    nodes: [
      { name: 'Total Claims', color: '#6366f1' }, // 0: indigo
      { name: 'Pending Review', color: '#f59e0b' }, // 1: amber
      { name: 'Processed', color: '#8b5cf6' }, // 2: violet
      { name: 'Approved', color: '#10b981' }, // 3: emerald
      { name: 'Rejected', color: '#f43f5e' }, // 4: rose
    ],
    links: [
      { source: 0, target: 1, value: pending > 0 ? pending : 0.1 },
      { source: 0, target: 2, value: processed > 0 ? processed : 0.1 },
      { source: 2, target: 3, value: approved > 0 ? approved : 0.1 },
      { source: 2, target: 4, value: rejected > 0 ? rejected : 0.1 },
    ],
  };

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={<CustomNode />}
          nodePadding={30}
          margin={{ left: 20, right: 120, top: 20, bottom: 20 }}
          link={{ stroke: '#475569', strokeOpacity: 0.3 }}
        >
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
            itemStyle={{ color: '#c7d2fe' }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
