import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { MapPin, Calendar, Clock, DollarSign, FileText } from 'lucide-react-native';
import type { Gig } from '@/types';
import { colors } from '@/constants/colors';

interface GigCardProps {
  gig: Gig;
  onPress: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const GigCard: React.FC<GigCardProps> = ({ gig, onPress }) => {
  const formattedDate = useMemo(() => gig.date ? formatDate(gig.date.toString()) : null, [gig.date]);
  const formattedCallTime = useMemo(() => gig.callTime ? formatTime(gig.callTime.toString()) : null, [gig.callTime]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${gig.title} at ${gig.venueName}`}
      accessibilityHint="Opens more details for this gig"
    >
      <View style={styles.header}>
        <Text style={styles.title}>{gig.title}</Text>
        {formattedDate && (
          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.primary} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={16} color={colors.subtext} />
          <Text style={styles.detailText}>{gig.venueName}</Text>
        </View>

        {gig.address && (
          <View style={styles.detailRow}>
            <View style={{ width: 16 }} />
            <Text style={[styles.detailText, styles.addressText]}>
              {gig.address}
            </Text>
          </View>
        )}

        {formattedCallTime && (
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.subtext} />
            <Text style={styles.detailText}>Call time: {formattedCallTime}</Text>
          </View>
        )}

        {gig.compensation && (
          <View style={styles.detailRow}>
            <DollarSign size={16} color={colors.subtext} />
            <Text style={styles.detailText}>{gig.compensation}</Text>
          </View>
        )}

        {gig.notes && (
          <View style={styles.notesRow}>
            <FileText size={16} color={colors.subtext} />
            <Text style={styles.detailText}>{gig.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.subtext,
    marginLeft: 8,
    flex: 1,
  },
  addressText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
});

export default GigCard;