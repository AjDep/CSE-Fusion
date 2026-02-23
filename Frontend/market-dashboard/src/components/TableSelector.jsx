import './TableSelector.css';
const formatTableName = (name) => {
  if (!name) return "";

  const parts = name.split("_");
  const dateIndex = parts.findIndex((p) => /^\d{4}$/.test(p));
  if (dateIndex === -1) return name.replace(/_/g, " ");

  const dateParts = parts.slice(dateIndex);
  if (dateParts.length < 3) return name.replace(/_/g, " ");

  const year = dateParts[0];
  const month = dateParts[1].padStart(2, "0");
  const day = dateParts[2].padStart(2, "0");
  const suffix = dateParts[3] ? ` -${dateParts[3]}` : "";

  return `${year}/${month}/${day}${suffix}`;
};

export default function TableSelector({ tables, value, onChange }) {
  return (
    <select
      className="dropdown border px-3 py-2 rounded"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {tables.map(t => (
        <option key={t}  className='result-item' value={t}>
          {formatTableName(t)}
        </option>
      ))}
    </select>
  );
}
