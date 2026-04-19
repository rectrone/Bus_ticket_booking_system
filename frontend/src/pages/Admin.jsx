import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminService } from '../services/bookingService.js';

const createRouteScheduleSchema = z
  .object({
    busId: z.string().min(1, 'Bus is required'),
    sourceCity: z.string().min(2, 'Source city must be at least 2 characters'),
    destCity: z.string().min(2, 'Destination city must be at least 2 characters'),
    distance: z.number().int().positive('Distance must be a positive integer'),
    baseFare: z.number().positive('Base fare must be positive'),
    departureTime: z.string().min(1, 'Departure time is required'),
    arrivalTime: z.string().min(1, 'Arrival time is required'),
    fare: z.number().positive('Fare must be positive'),
  })
  .refine((data) => new Date(data.departureTime) < new Date(data.arrivalTime), {
    message: 'Arrival time must be after departure time',
    path: ['arrivalTime'],
  });

const formatDateTimeForApi = (value) => new Date(value).toISOString();

export const Admin = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const form = useForm({
    resolver: zodResolver(createRouteScheduleSchema),
    defaultValues: {
      busId: '',
      sourceCity: '',
      destCity: '',
      departureTime: '',
      arrivalTime: '',
    },
  });

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const busesRes = await adminService.buses.list();
        setBuses(busesRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch buses:', error);
        setFeedback({
          type: 'error',
          message: 'Failed to load buses. Please refresh and try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  const onSubmit = async (data) => {
    setFeedback(null);

    try {
      const payload = {
        ...data,
        departureTime: formatDateTimeForApi(data.departureTime),
        arrivalTime: formatDateTimeForApi(data.arrivalTime),
      };

      const response = await adminService.routeSchedules.create(payload);
      const routeCreated = response.data.data?.routeCreated;

      setFeedback({
        type: 'success',
        message: routeCreated
          ? 'Route and schedule created successfully.'
          : 'Schedule created successfully using the existing route.',
      });

      form.reset({
        busId: data.busId,
        sourceCity: '',
        destCity: '',
        distance: undefined,
        baseFare: undefined,
        departureTime: '',
        arrivalTime: '',
        fare: undefined,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error.response?.data?.message || 'Failed to create route and schedule.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-3 text-center text-3xl font-bold text-blue-600">Book Bus</h1>
        <p className="mb-8 text-center text-gray-600">
          Create a bus route and its first schedule together in one step.
        </p>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Create Route and Schedule
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            Select a bus, enter the route details, and set the schedule timing and fare.
          </p>

          {feedback && (
            <div
              className={`mb-4 rounded p-4 ${
                feedback.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {buses.length === 0 ? (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              No buses are available yet. Create a bus first, then come back here to add its route and schedule.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block font-semibold text-gray-700">Bus</label>
                  <select
                    {...form.register('busId')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busNumber} ({bus.type}, {bus.totalSeats} seats)
                      </option>
                    ))}
                  </select>
                  {errors.busId && (
                    <p className="mt-1 text-sm text-red-500">{errors.busId.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">Source City</label>
                  <input
                    type="text"
                    {...form.register('sourceCity')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mumbai"
                  />
                  {errors.sourceCity && (
                    <p className="mt-1 text-sm text-red-500">{errors.sourceCity.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">
                    Destination City
                  </label>
                  <input
                    type="text"
                    {...form.register('destCity')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Delhi"
                  />
                  {errors.destCity && (
                    <p className="mt-1 text-sm text-red-500">{errors.destCity.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">Distance (km)</label>
                  <input
                    type="number"
                    {...form.register('distance', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1400"
                  />
                  {errors.distance && (
                    <p className="mt-1 text-sm text-red-500">{errors.distance.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">Base Fare (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('baseFare', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1500"
                  />
                  {errors.baseFare && (
                    <p className="mt-1 text-sm text-red-500">{errors.baseFare.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">Departure Time</label>
                  <input
                    type="datetime-local"
                    {...form.register('departureTime')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.departureTime && (
                    <p className="mt-1 text-sm text-red-500">{errors.departureTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">Arrival Time</label>
                  <input
                    type="datetime-local"
                    {...form.register('arrivalTime')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.arrivalTime && (
                    <p className="mt-1 text-sm text-red-500">{errors.arrivalTime.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block font-semibold text-gray-700">Schedule Fare (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('fare', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1600"
                  />
                  {errors.fare && (
                    <p className="mt-1 text-sm text-red-500">{errors.fare.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating...' : 'Create Route and Schedule'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
