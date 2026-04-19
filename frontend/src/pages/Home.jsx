import { useState, useEffect } from 'react';
import { SearchBuses } from '../components/SearchBuses.jsx';
import { BusSearchResults } from '../components/BusSearchResults.jsx';

export const Home = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (results) => {
    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-12 mb-8">
          <h1 className="text-4xl font-bold mb-2">RouteReserve</h1>
          <p className="text-xl">Book your journey with ease and comfort</p>
        </div>

        {/* Search Component */}
        <SearchBuses onSearchResults={handleSearch} />

        {/* Results */}
        {hasSearched && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {searchResults.length} buses found
            </h2>
            <BusSearchResults buses={searchResults} />
          </div>
        )}
      </div>
    </div>
  );
};
