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
  // Process data to include bid_dominance from DB
  const processedData = data.map(row => ({
    ...row,
    bid_dominance: row.ppl_dominance || 0
  }));

  // Calculate chart width based on data length for horizontal scrolling
  const chartWidth = Math.max(800, data.length * 10); // Minimum width of 800px, 50px per data point

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <ResponsiveContainer width={chartWidth} height={300}>
        <ComposedChart data={processedData} margin={{ bottom: 50 }}>
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
            {processedData.map((entry, index) => (
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