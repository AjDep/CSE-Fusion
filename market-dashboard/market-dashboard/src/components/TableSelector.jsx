export default function TableSelector({ tables, value, onChange }) {
  return (
    <select
      className="border px-3 py-2 rounded"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select a data table</option>
      {tables.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
