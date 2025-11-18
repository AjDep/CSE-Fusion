import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import chartColors from "../../config/chartColors";
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{ 
      backgroundColor: '#333333cc', 
      color: '#fff',
      padding: '10px', 
      borderRadius: '4px'
    }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>{`Date: ${label}`}</p>
      {payload.map((item, index) => (
        <p key={index} style={{ margin: 0, color: item.color }}>
          {item.name.includes('Dominance') 
            ? `${item.name}: ${Number(item.value).toFixed(2)}%`
            : `${item.name}: ${Number(item.value).toLocaleString()}`}
        </p> 
      ))}
    </div>
  );
};

export default function CompanyHistoryChart({ data }) {
  // Sort data by date ascending
  const sortedData = [...data].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  // Use diff_percent from API as bid_dominance
  const processedData = sortedData.map(row => ({
    ...row,
    bid_dominance: parseFloat(row.diff_percent) || 0, // use API value
    date: new Date(row.recorded_at).toISOString().split('T')[0] // format for x-axis
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" angle={-40} textAnchor="end" interval={0} height={60} tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" label={{ value: 'Bid/Ask Splits', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="right" orientation="right" label={{ value: 'Bid Dominance (%)', angle: -90, position: 'insideRight' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />

        <Line yAxisId="right" type="monotone" dataKey="bid_dominance" stroke={chartColors.bidDominance} name="Bid Dominance %" dot={false} />
        <Bar yAxisId="left" dataKey="total_bid_splits" name="Total Bid Splits" stackId="splits"  fill={chartColors.bidSplits} />
        <Bar yAxisId="left" dataKey="total_ask_splits" name="Total Ask Splits" stackId="splits" fill={chartColors.askSplits} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
