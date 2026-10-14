import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import { PieChart as PieIcon, Loader2 } from 'lucide-react';

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: { name: string; amount?: number };
  percent: number;
}

const renderActiveShape = (props: ActiveShapeProps) => {

  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#fff" fontSize={18} fontWeight={700}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {(percent * 100).toFixed(1)}% · ${payload.amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
        stroke="none"
      />
    </g>
  );
};

const TokenAllocation: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { assets, isLoading } = useOnChainBalances();
  const totalUsd = useMemo(
    () => assets.reduce((sum, a) => sum + a.usdValue, 0),
    [assets],
  );
  const tokens = assets;

  // Build pie data from live token balances
  const pieData = tokens
    .filter((t) => t.usdValue > 0)
    .map((t) => ({
      name: t.symbol,
      value: totalUsd > 0 ? parseFloat(((t.usdValue / totalUsd) * 100).toFixed(1)) : 0,
      amount: t.usdValue,
      color: t.color,
    }));

  // If no balances yet, show a single placeholder slice
  const displayData =
    pieData.length > 0
      ? pieData
      : [{ name: 'Empty', value: 100, amount: 0, color: '#1e2340' }];

  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{
        background: 'rgba(15, 20, 50, 0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00FFA3]/10">
          <PieIcon size={16} className="text-[#00FFA3]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Token Allocation</h3>
          <p className="text-xs text-gray-500">
            {isLoading ? 'Loading…' : `$${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} total`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 size={24} className="text-[#00D4FF] animate-spin" />
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  stroke="none"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-2">
            {pieData.length > 0 ? (
              pieData.map((token, index) => (
                <button
                  key={token.name}
                  onClick={() => setActiveIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${activeIndex === index ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: token.color }} />
                    <span className="text-sm text-gray-300 font-medium">{token.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-400">
                      ${token.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${token.color}15`, color: token.color }}
                    >
                      {token.value}%
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-xs text-gray-600 py-2">
                No token balances in smart wallet yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TokenAllocation;
