export default function CompanySelector({ companies, value, onChange }) {
  return (
    <select
      className="border px-3 py-2 rounded"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select a company</option>
      {companies.map(c => (
        <option key={c.security} value={c.security}>
          {c.security} {/* or c.company_name if you have it */}
        </option>
      ))}
    </select>
  );
}
