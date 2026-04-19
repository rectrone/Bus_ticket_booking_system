import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingService } from '../services/bookingService.js';

const searchSchema = z.object({
  sourceCity: z.string().min(2, 'Source city required'),
  destCity: z.string().min(2, 'Destination city required'),
  travelDate: z.string().min(1, 'Travel date required'),
  busType: z.string().optional(),
  maxPrice: z.number().optional(),
});

export const SearchBuses = ({ onSearchResults }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(searchSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await bookingService.search(data);
      onSearchResults(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Search Buses</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Source City</label>
          <input
            {...register('sourceCity')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., Mumbai"
          />
          {errors.sourceCity && <p className="text-red-600 text-sm mt-1">{errors.sourceCity.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Destination</label>
          <input
            {...register('destCity')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., Delhi"
          />
          {errors.destCity && <p className="text-red-600 text-sm mt-1">{errors.destCity.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Travel Date</label>
          <input
            type="date"
            {...register('travelDate')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
          />
          {errors.travelDate && <p className="text-red-600 text-sm mt-1">{errors.travelDate.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Bus Type</label>
          <select
            {...register('busType')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="">Any</option>
            <option value="ECONOMY">Economy</option>
            <option value="COMFORT">Comfort</option>
            <option value="SLEEPER">Sleeper</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">&nbsp;</label>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
};
