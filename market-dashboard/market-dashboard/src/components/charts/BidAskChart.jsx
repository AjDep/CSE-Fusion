import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function BidAskChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="security" 
          angle={-40}
          textAnchor="end"
          height={60}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total_bid_splits" fill="#16a34a" name="Total Bid" />
        <Bar dataKey="total_ask_splits" fill="#dc2626" name="Total Ask" />
      </BarChart>
    </ResponsiveContainer>
  );
}