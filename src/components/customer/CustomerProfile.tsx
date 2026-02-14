import { motion } from 'framer-motion';
import { User, Phone, MapPin, Hash, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerBookings } from '@/hooks/useBookings';
import { usePanchayaths } from '@/hooks/usePanchayaths';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function CustomerProfile() {
  const { profile } = useAuth();
  const { data: bookings, isLoading } = useCustomerBookings();
  const { data: panchayaths } = usePanchayaths();

  const panchayathName = panchayaths?.find(p => p.id === profile?.panchayath_id)?.name;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Profile Card */}
      <div className="bg-card rounded-xl p-5 shadow-soft border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-teal" />
          My Profile
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-light-blue flex items-center justify-center">
              <User className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <p className="font-medium text-foreground">{profile?.full_name || 'Customer'}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{profile.phone}</span>
            </div>
          )}
          {panchayathName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{panchayathName}</span>
            </div>
          )}
          {profile?.ward_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span>Ward {profile.ward_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking History */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">📋 My Bookings</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !bookings?.length ? (
          <div className="bg-card rounded-xl p-6 text-center border">
            <p className="text-muted-foreground">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-4 border shadow-soft"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-brand-navy text-sm">
                    #{booking.booking_number}
                  </span>
                  <Badge className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}>
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {booking.scheduled_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {booking.scheduled_time}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-brand-teal">
                    ₹{Number(booking.total_price).toLocaleString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
