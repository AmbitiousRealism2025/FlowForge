import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { GigCard } from '@/components/GigCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar, SearchResults } from '@/components/SearchBar';
import { useGigStore } from '@/store/gigStore';
import { colors } from '@/constants/colors';
import { taskDeleted, errorOccurred } from '@/utils/haptics';
import { searchGigs, debounce } from '@/utils/search';

export default function GigsScreen() {
  const { gigs, isLoading, deleteGig } = useGigStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddPress = () => {
    router.push('/add-gig');
  };

  const handleGigPress = (gigId: string) => {
    router.push({
      pathname: '/edit-gig',
      params: { id: gigId }
    });
  };

  const handleGigLongPress = async (gigId: string) => {
    Alert.alert(
      'Delete Gig',
      'Are you sure you want to delete this gig?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteGig(gigId);
            taskDeleted();
          } catch (error) {
            errorOccurred();
            Alert.alert('Error', 'Failed to delete gig. Please try again.');
          }
        }}
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Search and filter gigs
  const filteredGigs = useMemo(() => {
    return searchGigs(gigs, searchQuery);
  }, [gigs, searchQuery]);

  // Sort gigs by date (upcoming first)
  const sortedGigs = useMemo(() => {
    return [...filteredGigs].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredGigs]);

  const debouncedSearch = useCallback(
    debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  const handleSearchChange = useCallback((text: string) => {
    debouncedSearch(text);
  }, [debouncedSearch]);

  const renderGig = useCallback(({ item }: { item: any }) => (
    <GigCard
      gig={item}
      onPress={() => handleGigPress(item.id)}
    />
  ), []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (isLoading && gigs.length === 0) {
    return <LoadingState type="skeleton" skeletonType="card" count={3} />;
  }

  return (
    <View style={styles.container} accessibilityLabel="Gigs Screen" focusable>
      {gigs.length > 0 && (
        <SearchBar
          placeholder="Search gigs by title, venue, or location..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          onClear={() => setSearchQuery('')}
        />
      )}

      {searchQuery.trim() && (
        <SearchResults
          query={searchQuery}
          totalResults={sortedGigs.length}
          isSearching={false}
        />
      )}

      {sortedGigs.length > 0 ? (
        <FlatList
          data={sortedGigs}
          renderItem={renderGig}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={8}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 200, // Approximate height of GigCard
            offset: 200 * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <EmptyState
          title="No Gigs Scheduled"
          message="Add your upcoming gigs to keep track of venues, call times, and compensation."
          icon={<Calendar size={48} color={colors.primary} />}
          accessibilityLabel="No gigs scheduled. Add your upcoming gigs to keep track of venues, call times, and compensation."
        />
      )}

      <FloatingActionButton
        onPress={handleAddPress}
        accessibilityLabel="Add new gig"
        accessibilityHint="Opens a screen to create a new gig"
        accessibilityRole="button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
});
