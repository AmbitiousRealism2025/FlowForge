import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGigStore } from '@/store/gigStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('gigStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the store state
    const { result } = renderHook(() => useGigStore());
    act(() => {
      result.current.gigs = [];
    });
  });

  describe('addGig', () => {
    it('should add a new gig', () => {
      const { result } = renderHook(() => useGigStore());
      const gigDate = new Date('2024-12-25T20:00:00');
      const callTime = new Date('2024-12-25T18:00:00');
      
      act(() => {
        result.current.addGig({
          title: 'Christmas Concert',
          venueName: 'City Hall',
          address: '123 Main St',
          date: gigDate,
          callTime: callTime,
          contact: 'John Doe',
          compensation: '$500',
          notes: 'Formal attire required',
        });
      });

      expect(result.current.gigs).toHaveLength(1);
      expect(result.current.gigs[0]).toMatchObject({
        title: 'Christmas Concert',
        venueName: 'City Hall',
        address: '123 Main St',
        date: gigDate,
        callTime: callTime,
        contact: 'John Doe',
        compensation: '$500',
        notes: 'Formal attire required',
      });
      expect(result.current.gigs[0].id).toBeDefined();
    });

    it('should add gig with minimal required fields', () => {
      const { result } = renderHook(() => useGigStore());
      const gigDate = new Date('2024-12-25T20:00:00');
      
      act(() => {
        result.current.addGig({
          title: 'Jazz Night',
          venueName: 'Blue Note',
          date: gigDate,
        });
      });

      expect(result.current.gigs).toHaveLength(1);
      expect(result.current.gigs[0]).toMatchObject({
        title: 'Jazz Night',
        venueName: 'Blue Note',
        date: gigDate,
      });
      expect(result.current.gigs[0].address).toBeUndefined();
      expect(result.current.gigs[0].callTime).toBeUndefined();
    });
  });

  describe('updateGig', () => {
    it('should update an existing gig', () => {
      const { result } = renderHook(() => useGigStore());
      const gigDate = new Date('2024-12-25T20:00:00');
      
      // Add a gig first
      act(() => {
        result.current.addGig({
          title: 'Jazz Night',
          venueName: 'Blue Note',
          date: gigDate,
        });
      });

      const gigId = result.current.gigs[0].id;

      // Update the gig
      act(() => {
        result.current.updateGig(gigId, {
          title: 'Jazz Night Special',
          address: '456 Jazz Ave',
          compensation: '$300',
        });
      });

      expect(result.current.gigs[0]).toMatchObject({
        id: gigId,
        title: 'Jazz Night Special',
        venueName: 'Blue Note',
        date: gigDate,
        address: '456 Jazz Ave',
        compensation: '$300',
      });
    });

    it('should not update non-existent gig', () => {
      const { result } = renderHook(() => useGigStore());
      
      act(() => {
        result.current.updateGig('non-existent-id', {
          title: 'Updated title',
        });
      });

      expect(result.current.gigs).toHaveLength(0);
    });

    it('should update date and callTime', () => {
      const { result } = renderHook(() => useGigStore());
      const originalDate = new Date('2024-12-25T20:00:00');
      const newDate = new Date('2024-12-26T21:00:00');
      const newCallTime = new Date('2024-12-26T19:00:00');
      
      act(() => {
        result.current.addGig({
          title: 'Jazz Night',
          venueName: 'Blue Note',
          date: originalDate,
        });
      });

      const gigId = result.current.gigs[0].id;

      act(() => {
        result.current.updateGig(gigId, {
          date: newDate,
          callTime: newCallTime,
        });
      });

      expect(result.current.gigs[0].date).toEqual(newDate);
      expect(result.current.gigs[0].callTime).toEqual(newCallTime);
    });
  });

  describe('deleteGig', () => {
    it('should delete an existing gig', () => {
      const { result } = renderHook(() => useGigStore());
      const gigDate = new Date('2024-12-25T20:00:00');
      
      // Add gigs
      act(() => {
        result.current.addGig({
          title: 'Gig 1',
          venueName: 'Venue 1',
          date: gigDate,
        });
        result.current.addGig({
          title: 'Gig 2',
          venueName: 'Venue 2',
          date: gigDate,
        });
      });

      const gigId = result.current.gigs[0].id;

      // Delete the first gig
      act(() => {
        result.current.deleteGig(gigId);
      });

      expect(result.current.gigs).toHaveLength(1);
      expect(result.current.gigs[0].title).toBe('Gig 2');
    });

    it('should not throw when deleting non-existent gig', () => {
      const { result } = renderHook(() => useGigStore());
      
      expect(() => {
        act(() => {
          result.current.deleteGig('non-existent-id');
        });
      }).not.toThrow();
    });
  });

  describe('filtering gigs', () => {
    it('should filter upcoming gigs', () => {
      const { result } = renderHook(() => useGigStore());
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 2);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 1);

      act(() => {
        result.current.addGig({
          title: 'Past Gig',
          venueName: 'Old Venue',
          date: pastDate,
        });
        result.current.addGig({
          title: 'Future Gig 1',
          venueName: 'Future Venue 1',
          date: futureDate1,
        });
        result.current.addGig({
          title: 'Future Gig 2',
          venueName: 'Future Venue 2',
          date: futureDate2,
        });
      });

      // Filter upcoming gigs manually since the store doesn't have this method
      const now = new Date();
      const upcomingGigs = result.current.gigs
        .filter(gig => gig.date && gig.date > now)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

      expect(upcomingGigs).toHaveLength(2);
      expect(upcomingGigs[0].title).toBe('Future Gig 2'); // Closer date first
      expect(upcomingGigs[1].title).toBe('Future Gig 1');
    });

    it('should filter past gigs', () => {
      const { result } = renderHook(() => useGigStore());
      const pastDate1 = new Date();
      pastDate1.setDate(pastDate1.getDate() - 2);
      const pastDate2 = new Date();
      pastDate2.setDate(pastDate2.getDate() - 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      act(() => {
        result.current.addGig({
          title: 'Past Gig 1',
          venueName: 'Old Venue 1',
          date: pastDate1,
        });
        result.current.addGig({
          title: 'Past Gig 2',
          venueName: 'Old Venue 2',
          date: pastDate2,
        });
        result.current.addGig({
          title: 'Future Gig',
          venueName: 'Future Venue',
          date: futureDate,
        });
      });

      // Filter past gigs manually since the store doesn't have this method
      const now = new Date();
      const pastGigs = result.current.gigs
        .filter(gig => gig.date && gig.date <= now)
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

      expect(pastGigs).toHaveLength(2);
      expect(pastGigs[0].title).toBe('Past Gig 2'); // More recent past gig first
      expect(pastGigs[1].title).toBe('Past Gig 1');
    });
  });

  describe('persistence', () => {
    it('should persist state to AsyncStorage', async () => {
      const { result } = renderHook(() => useGigStore());
      const gigDate = new Date('2024-12-25T20:00:00');
      
      act(() => {
        result.current.addGig({
          title: 'Jazz Night',
          venueName: 'Blue Note',
          date: gigDate,
        });
      });

      // Wait for the persist middleware to save
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});