import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface DateTimePickerProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  mode?: 'date' | 'time' | 'datetime';
  placeholder?: string;
}

export const CustomDateTimePicker = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = 'Select date',
}: DateTimePickerProps) => {
  const [show, setShow] = useState(false);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>(mode === 'datetime' ? 'date' : mode);

  // Ensure value is a proper Date object
  const dateValue = value instanceof Date ? value : value ? new Date(value) : undefined;

  const showPicker = () => {
    setShow(true);
    setCurrentMode(mode === 'datetime' ? 'date' : mode);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateValue;
    
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (mode === 'datetime' && currentMode === 'date' && selectedDate) {
      setCurrentMode('time');
      if (Platform.OS === 'ios') {
        onChange(selectedDate);
      }
      return;
    }

    onChange(currentDate);
    setShow(Platform.OS === 'ios');
  };

  const formatDate = (date?: Date) => {
    if (!date) return placeholder;
    
    if (mode === 'date' || mode === 'datetime') {
      return date.toLocaleDateString();
    } else if (mode === 'time') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleString();
  };

  const getIcon = () => {
    if (mode === 'time') {
      return <Clock size={20} color={colors.primary} />;
    }
    return <Calendar size={20} color={colors.primary} />;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={showPicker}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={[styles.dateText, !dateValue && styles.placeholder]}>
          {formatDate(dateValue)}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dateValue || new Date()}
          mode={currentMode}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.background,
  },
  iconContainer: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.subtext,
  },
});
