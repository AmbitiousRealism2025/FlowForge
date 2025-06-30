import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GigCard } from '../GigCard';
import { Gig } from '@/types';

describe('GigCard', () => {
  const baseGig: Gig = {
    id: '1',
    title: 'Jazz Night',
    venueName: 'Blue Note Club', // Changed to avoid conflict with parts of title in assertions
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('renders essential gig info and handles press', () => {
    const { getByText } = render(<GigCard gig={baseGig} onPress={mockOnPress} />);

    expect(getByText('Jazz Night')).toBeTruthy();
    expect(getByText('Blue Note Club')).toBeTruthy();

    fireEvent.press(getByText('Jazz Night'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('does not render optional elements when data is missing', () => {
    const { queryByText, queryByLabelText } = render(
      <GigCard gig={baseGig} onPress={mockOnPress} />
    );

    // Date (formatted) - assumes specific formatting, might need more robust check
    // For now, check for common parts of date string or absence of related icon
    expect(queryByText(/(\w{3}), (\w{3}) \d{1,2}, \d{4}/i)).toBeNull(); // Regex for "Mon, Jan 1, 2023"

    // Navigate button does not exist in current implementation
    expect(queryByText('Navigate')).toBeNull();

    // Call Time
    expect(queryByText(/Call time:/i)).toBeNull();

    // Contact, Compensation, Notes:
    // These tests rely on the text content itself. If the gig object doesn't have these fields,
    // their corresponding text won't be rendered.
    // More specific tests for these would involve querying for icons if they had unique ones,
    // or ensuring that if the text *could* match other fields, the query is specific enough.
    // For now, the "renders X when provided" tests cover their presence.
    // Explicitly check for absence of text that would be rendered if these fields had values.
    // This assumes the values for these fields are unique enough not to be part of title/venue.
    expect(queryByText('John Doe - 555-1234')).toBeNull(); // Example contact
    expect(queryByText('$500')).toBeNull(); // Example compensation
    expect(queryByText('Bring stand light')).toBeNull(); // Example notes
  });

  it('renders address when provided', () => {
    const gigWithAddress: Gig = {
      ...baseGig,
      address: '123 Music Lane',
    };
    const { getByText } = render(<GigCard gig={gigWithAddress} onPress={mockOnPress} />);

    expect(getByText('123 Music Lane')).toBeTruthy();
  });

  it('renders formatted date when date is provided', () => {
    const testDate = new Date(2023, 0, 15); // Jan 15, 2023
    const gigWithDate: Gig = { ...baseGig, date: testDate };
    const { getByText } = render(<GigCard gig={gigWithDate} onPress={mockOnPress} />);

    // The component formats dates as "Jan 15, 2023" (no weekday)
    const expectedDateString = testDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    expect(getByText(expectedDateString)).toBeTruthy();
  });

  it('renders formatted call time when callTime is provided', () => {
    const gigWithCallTime: Gig = { ...baseGig, callTime: '18:30' as any }; // Component expects callTime as string
    const { getByText } = render(<GigCard gig={gigWithCallTime} onPress={mockOnPress} />);

    // Component formats as "6:30 PM"
    expect(getByText('Call time: 6:30 PM')).toBeTruthy();
  });

  // Contact info is not displayed in the current component implementation
  it('does not render contact info (not implemented in component)', () => {
    const gigWithContact: Gig = { ...baseGig, contact: 'John Doe - 555-1234' };
    const { queryByText } = render(<GigCard gig={gigWithContact} onPress={mockOnPress} />);
    expect(queryByText('John Doe - 555-1234')).toBeNull();
  });

  // Example for compensation
  it('renders compensation when provided', () => {
    const gigWithCompensation: Gig = { ...baseGig, compensation: '$500' };
    const { getByText } = render(<GigCard gig={gigWithCompensation} onPress={mockOnPress} />);
    expect(getByText('$500')).toBeTruthy();
  });

  // Example for notes
  it('renders notes when provided', () => {
    const gigWithNotes: Gig = { ...baseGig, notes: 'Bring stand light' };
    const { getByText } = render(<GigCard gig={gigWithNotes} onPress={mockOnPress} />);
    expect(getByText('Bring stand light')).toBeTruthy();
  });

  it('renders with all optional data provided', () => {
    const fullGigDate = new Date(2024, 2, 10); // March 10, 2024
    const fullGigCallTime = '17:00'; // Use string format that component expects

    const fullGig: Gig = {
      ...baseGig,
      date: fullGigDate,
      address: '456 Show Rd, Performance City',
      callTime: fullGigCallTime as any,
      contact: 'Jane Manager - 555-0000',
      compensation: '$1000',
      notes: 'Setup early, soundcheck at 6 PM.',
    };

    const { getByText } = render(<GigCard gig={fullGig} onPress={mockOnPress} />);

    // Check date (no weekday in component format)
    const expectedDateString = fullGigDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    expect(getByText(expectedDateString)).toBeTruthy();

    // Check address (no navigate button in current implementation)
    expect(getByText('456 Show Rd, Performance City')).toBeTruthy();

    // Check callTime - should display "5:00 PM"
    expect(getByText('Call time: 5:00 PM')).toBeTruthy();

    // Check compensation
    expect(getByText('$1000')).toBeTruthy();

    // Check notes
    expect(getByText('Setup early, soundcheck at 6 PM.')).toBeTruthy();

    // Contact is not rendered in current component implementation
  });
});
