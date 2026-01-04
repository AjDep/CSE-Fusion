import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{ 
      backgroundColor: '#bebebe78', 
      color: '#ffffffff',
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '4px'
    }}>
      <p style={{ margin: '0', fontWeight: 'bold' }}>{`Security: ${label}`}</p>
      {payload.map((item, index) => (
        <p key={index} style={{ 
          margin: '0',
          color: item.dataKey === 'diff_percent' ? '#00226dff' : '#16a34a'
        }}>
          {`${item.name}: ${item.value.toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits: 2})}%`}
        </p>
      ))}
    </div>
  );
};


export default function LineDiffChart({ data }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 50;

  const processedData = data.map(row => ({
    ...row,
    bid_dominance: row.ppl_dominance || 0
  }));

  const visibleData = processedData.slice(startIndex, startIndex + itemsPerPage);

  const visibleValues = visibleData.flatMap(d => [
    Number(d.diff_percent) || 0,
    Number(d.bid_dominance) || 0
  ]);
  const minValue = Math.min(...visibleValues);
  const maxValue = Math.max(...visibleValues);
  const padding = (maxValue - minValue) * 0.1 || 1;
  const yDomain = [minValue - padding, maxValue + padding];

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + itemsPerPage < processedData.length;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center'  }}>
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
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedData.length)} of {processedData.length}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={visibleData} margin={{ bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="security" 
            angle={-70} 
            textAnchor="end" 
            height={10} 
            interval={0} 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.replace(/0+$/, '')}
          />
          <YAxis 
            yAxisId="left" 
            domain={yDomain}
            tickFormatter={(value) => value.toFixed(0)}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />}/>
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="diff_percent" 
            stroke="#7aa4ffff" 
            name="Buy Dominance"
            dot={false}
          />
          <Bar 
            yAxisId="left" 
            dataKey="bid_dominance" 
            name="buyer to seller in no ppl"
            barSize={20}
          >
            {visibleData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={Number(entry.bid_dominance) < 0 ? "#b80a0aff" : "#39c26bff"}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}