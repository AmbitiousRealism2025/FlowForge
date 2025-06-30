import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors } from '@/constants/colors';

interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'skeleton';
  skeletonType?: 'list' | 'card' | 'form';
  count?: number;
}

interface SkeletonItemProps {
  style?: ViewStyle;
}

const SkeletonItem: React.FC<SkeletonItemProps> = ({ style }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

const ListSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonListItem}>
          <SkeletonItem style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <SkeletonItem style={styles.skeletonTitle} />
            <SkeletonItem style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );
};

const CardSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <SkeletonItem style={styles.skeletonCardHeader} />
          <SkeletonItem style={styles.skeletonCardContent} />
          <SkeletonItem style={styles.skeletonCardFooter} />
        </View>
      ))}
    </View>
  );
};

const FormSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonItem style={styles.skeletonFormField} />
      <SkeletonItem style={styles.skeletonFormField} />
      <SkeletonItem style={styles.skeletonFormTextArea} />
      <SkeletonItem style={styles.skeletonFormField} />
    </View>
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  type = 'spinner',
  skeletonType = 'list',
  count = 5
}) => {
  if (type === 'skeleton') {
    switch (skeletonType) {
      case 'list':
        return <ListSkeleton count={count} />;
      case 'card':
        return <CardSkeleton count={count} />;
      case 'form':
        return <FormSkeleton />;
      default:
        return <ListSkeleton count={count} />;
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.subtext,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 12,
    borderRadius: 6,
    width: '50%',
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  skeletonCardHeader: {
    height: 20,
    borderRadius: 10,
    marginBottom: 12,
    width: '60%',
  },
  skeletonCardContent: {
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
    width: '80%',
  },
  skeletonCardFooter: {
    height: 12,
    borderRadius: 6,
    width: '40%',
  },
  skeletonFormField: {
    height: 48,
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonFormTextArea: {
    height: 100,
    borderRadius: 8,
    marginBottom: 16,
  },
});