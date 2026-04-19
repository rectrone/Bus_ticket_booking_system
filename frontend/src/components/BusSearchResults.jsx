import { useState } from 'react';
import { Link } from 'react-router-dom';

export const BusSearchResults = ({ buses }) => {
  return (
    <div className="space-y-4">
      {buses.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No buses found. Try adjusting your search criteria.
        </div>
      ) : (
        buses.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-gray-600 text-sm">Bus</p>
                <p className="text-xl font-bold">{schedule.bus.busNumber}</p>
                <p className="text-xs text-gray-500">{schedule.bus.type}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Route</p>
                <p className="text-lg font-semibold">
                  {schedule.route.sourceCity} → {schedule.route.destCity}
                </p>
                <p className="text-xs text-gray-500">{schedule.route.distance} km</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Departure</p>
                <p className="text-lg font-semibold">
                  {new Date(schedule.departureTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(schedule.departureTime).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Price & Seats</p>
                  <p className="text-2xl font-bold text-green-600">₹{schedule.fare}</p>
                  <p className="text-xs text-gray-500">{schedule.availableSeats} seats available</p>
                </div>
                <Link
                  to={`/booking/${schedule.id}`}
                  className="bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
