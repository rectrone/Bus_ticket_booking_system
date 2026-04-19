import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { bookingService } from '../services/bookingService.js';

export const BookingHistory = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingService.getHistory();
      setBookings(response.data.data);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(bookingId);
      alert('Booking cancelled successfully');
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-xl">No bookings found</p>
          <a href="/" className="text-blue-600 hover:underline mt-4 block">
            Start booking a bus
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">PNR</p>
                  <p className="text-lg font-bold">{booking.pnr}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Route</p>
                  <p className="font-semibold">
                    {booking.schedule.route.sourceCity} → {booking.schedule.route.destCity}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Date & Time</p>
                  <p className="font-semibold">
                    {new Date(booking.schedule.departureTime).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    {new Date(booking.schedule.departureTime).toLocaleTimeString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className={`font-bold ${
                    booking.bookingStatus === 'CONFIRMED' ? 'text-green-600' :
                    booking.bookingStatus === 'CANCELLED' ? 'text-red-600' :
                    booking.bookingStatus === 'PENDING' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {booking.bookingStatus}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Total Fare</p>
                  <p className="text-2xl font-bold text-green-600">₹{booking.totalFare}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <span className="text-sm text-gray-600">Seats: </span>
                  <div className="flex gap-1">
                    {booking.bookingSeats.map((bs) => (
                      <span key={bs.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
                        {bs.seat.seatNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {booking.bookingStatus === 'CONFIRMED' && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
