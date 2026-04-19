import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminService, bookingService } from '../services/bookingService.js';
import { useAuth } from '../context/AuthContext.jsx';

const bookingSchema = z.object({
  seatIds: z.array(z.string()).min(1, 'Select at least 1 seat').max(6, 'Maximum 6 seats'),
  passengerName: z.string().min(2, 'Name required'),
  passengerEmail: z.string().email('Invalid email'),
  passengerPhone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
});

export const BookingPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    // Load schedule details
    const loadSchedule = async () => {
      try {
        const response = await adminService.schedules.get(scheduleId);
        setSchedule(response.data.data);
        if (user) {
          setValue('passengerEmail', user.email);
          setValue('passengerPhone', user.phone);
          setValue('passengerName', `${user.firstName} ${user.lastName}`);
        }
      } catch (err) {
        setError('Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [scheduleId, user, setValue]);

  const handleSeatClick = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else if (selectedSeats.length < 6) {
      setSelectedSeats([...selectedSeats, seatId]);
    }
    setValue('seatIds', selectedSeats.includes(seatId)
      ? selectedSeats.filter(id => id !== seatId)
      : [...selectedSeats, seatId]
    );
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    try {
      const bookingData = {
        scheduleId,
        seatIds: selectedSeats,
        passengerName: data.passengerName,
        passengerEmail: data.passengerEmail,
        passengerPhone: data.passengerPhone,
      };

      const response = await bookingService.createBooking(bookingData);
      const booking = response.data.data;
      
      // Show success message
      alert(`Booking confirmed! PNR: ${booking.pnr}`);
      navigate('/bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!schedule) {
    return <div className="text-center text-red-600 mt-8">{error || 'Schedule not found'}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Seat Selection */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Select Seats</h2>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">
                {schedule.bus.busNumber} | {schedule.route.sourceCity} → {schedule.route.destCity}
              </p>
              <p className="text-sm text-gray-600">
                Departure: {new Date(schedule.departureTime).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {schedule.seats.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat.id)}
                  disabled={seat.status !== 'AVAILABLE'}
                  className={`p-3 rounded font-semibold text-sm transition ${
                    seat.status === 'AVAILABLE'
                      ? selectedSeats.includes(seat.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {seat.seatNumber}
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="inline-block w-4 h-4 bg-gray-200 rounded mr-2"></span>Available</p>
              <p><span className="inline-block w-4 h-4 bg-green-500 rounded mr-2"></span>Selected</p>
              <p><span className="inline-block w-4 h-4 bg-gray-400 rounded mr-2"></span>Booked</p>
            </div>
          </div>
        </div>

        {/* Booking Details Form */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-xl font-bold mb-4">Booking Details</h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Selected Seats</p>
              <p className="text-lg font-bold text-blue-600">
                {selectedSeats.length > 0
                  ? schedule.seats
                      .filter(s => selectedSeats.includes(s.id))
                      .map(s => s.seatNumber)
                      .join(', ')
                  : 'None'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name</label>
                <input
                  {...register('passengerName')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
                {errors.passengerName && <p className="text-red-600 text-sm mt-1">{errors.passengerName.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  {...register('passengerEmail')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
                {errors.passengerEmail && <p className="text-red-600 text-sm mt-1">{errors.passengerEmail.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  {...register('passengerPhone')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
                {errors.passengerPhone && <p className="text-red-600 text-sm mt-1">{errors.passengerPhone.message}</p>}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Fare per seat:</span>
                  <span className="font-bold">₹{schedule.fare}</span>
                </div>
                <div className="flex justify-between mb-4 text-lg">
                  <span>Total:</span>
                  <span className="font-bold text-green-600">₹{schedule.fare * selectedSeats.length}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={selectedSeats.length === 0 || isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
