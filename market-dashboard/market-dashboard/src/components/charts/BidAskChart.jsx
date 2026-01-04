import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function BidAskChart({ data }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 50

  const visibleData = data.slice(startIndex, startIndex + itemsPerPage);

  const visibleValues = visibleData.flatMap(d => [
    Number(d.total_bid_splits) || 0,
    Number(d.total_ask_splits) || 0
  ]);
  const minValue = Math.min(...visibleValues);
  const maxValue = Math.max(...visibleValues);
  const padding = (maxValue - minValue) * 0.1 || 1;
  const yDomain = [minValue - padding, maxValue + padding];

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + itemsPerPage < data.length;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          onClick={() => setStartIndex(Math.max(0, startIndex - itemsPerPage))}
          disabled={!canGoBack}
          style={{
            padding: '5px 15px',
            cursor: canGoBack ? 'pointer' : 'not-allowed',
            opacity: canGoBack ? 1 : 0.5
          }}
        >
          ← Previous
        </button>
        <button 
          onClick={() => setStartIndex(startIndex + itemsPerPage)}
          disabled={!canGoForward}
          style={{
            padding: '5px 15px',
            cursor: canGoForward ? 'pointer' : 'not-allowed',
            opacity: canGoForward ? 1 : 0.5
          }}
        >
          Next →
        </button>
        <span style={{ fontSize: '14px', color: '#666' }}>
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, data.length)} of {data.length}
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={visibleData} margin={{ bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="security" 
            angle={-70}
            textAnchor="end"
            height={20}
            interval={0}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.replace(/0+$/, '')}
          />
          <YAxis 
          tickFormatter={(value) => value.toFixed(0)}
          domain={yDomain} />
          <Tooltip />
          <Bar dataKey="total_bid_splits" fill="#16a34a" name="Total Bid" />
          <Bar dataKey="total_ask_splits" fill="#dc2626" name="Total Ask" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}