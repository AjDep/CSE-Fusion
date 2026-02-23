import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import chartColors from "../../config/chartColors";
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  // Format the timestamp to show date and time
  const formattedDate = new Date(label).toLocaleString();

  return (
    <div style={{ 
      backgroundColor: '#333333cc', 
      color: '#fff',
      padding: '10px', 
      borderRadius: '4px'
    }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>{`Date: ${formattedDate}`}</p>
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
  const processedData = sortedData.map((row,index) => ({
    ...row,
    bid_dominance: parseFloat(row.diff_percent) || 0, // use API value
    date: new Date(row.recorded_at).toISOString().split('T')[0], // format for x-axis
    timestamp: row.recorded_at,
    displayTime: new Date(row.recorded_at).toLocaleTimeString()
   
  }));
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" angle={-40} textAnchor="end" interval={0} height={60} tick={{ fontSize: 12 }} tickFormatter={(timestamp) => new Date(timestamp).toISOString().split('T')[0]}/>
        <YAxis yAxisId="right" orientation="left" label={{ value: 'Bid Dominance (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />

       
        <Bar yAxisId="left" dataKey="total_bid_splits" name="Total Bid Splits" stackId="splits"  fill={chartColors.bidSplits} />
        <Bar yAxisId="left" dataKey="total_ask_splits" name="Total Ask Splits" stackId="splits" fill={chartColors.askSplits} />
        <Line yAxisId="right" type="monotone" dataKey="bid_dominance" stroke={chartColors.bidDominance} name="Bid Dominance" dot={false} activeDot={{ r: 6 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
