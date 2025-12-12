import { useState } from 'react';
import './CompanySearchBar.css';
import { FaSearch } from 'react-icons/fa';
import { useCompanies } from '../hooks/useMarketData';

const CompanySearchBar = ({ setResults }) => {
  const [inputValue, setInput] = useState('');
  const [showResults, setShowResults] = useState(false); // controls visibility
  const companies = useCompanies();

  // Filter companies only if user typed
  const filtered = inputValue
    ? companies.filter(c =>
        c.security.toLowerCase().includes(inputValue.toLowerCase()) ||
        (c.company_name && c.company_name.toLowerCase().includes(inputValue.toLowerCase()))
      )
    : [];

  // Handle click on a company
  const handleSelect = (company) => {
    setResults(company.security); // update parent
    setInput(company.security);    // show selected value in input
    setShowResults(false);         // hide results
  };

  return (
    <div className='SearchBarContainer'>
      <div className='input-wrapper'>
        <FaSearch className='search-icon' />
        <input
          type="text"
          className='search-input'
          placeholder='Search for a company...'
          value={inputValue}
          onChange={(e) => {
            setInput(e.target.value);
            setShowResults(true); // show results when typing
          }}
        />
      </div>

      {/* Only show results if showResults is true */}
      {showResults && inputValue && (
        <div className='result-list'>
          {filtered.length === 0 && <div>No results found</div>}

          {filtered.map(c => (
            <div
              key={c.security}
              className='result-item'
              onClick={() => handleSelect(c)}
            >
              {c.security}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySearchBar;
