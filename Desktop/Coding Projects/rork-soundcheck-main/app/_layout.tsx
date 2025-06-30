import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import { ASYNC_STORAGE_HAS_LAUNCHED } from "@/constants/storageKeys";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const value = await AsyncStorage.getItem(ASYNC_STORAGE_HAS_LAUNCHED);
        if (value === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error("Error checking first launch:", error);
        setIsFirstLaunch(false);
      }
    }
    
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded && isFirstLaunch !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isFirstLaunch]);

  if (!loaded || isFirstLaunch === null) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      {isFirstLaunch ? <OnboardingLayout setIsFirstLaunch={setIsFirstLaunch} /> : <RootLayoutNav />}
    </ErrorBoundary>
  );
}

function OnboardingLayout({ setIsFirstLaunch }: { setIsFirstLaunch: (value: boolean) => void }) {
  const [currentPage, setCurrentPage] = useState(0);
  const { width } = Dimensions.get('window');
  
  const onboardingPages = [
    {
      title: "Welcome to SoundCheck",
      description: "Your streamlined assistant for managing rehearsals and gigs in one place.",
    },
    {
      title: "Rehearsal Tasks",
      description: "Create and organize tasks for your rehearsals. Group them by event and mark them as complete when done.",
    },
    {
      title: "Practice Tracking",
      description: "Keep track of your personal practice goals and progress with categorized practice tasks.",
    },
    {
      title: "Gig Management",
      description: "Add gigs with venue details, call times, and compensation. Navigate to venues with a single tap.",
    },
    {
      title: "Ready to Rock!",
      description: "You're all set to start organizing your music career. Let's get started!",
    }
  ];
  
  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_HAS_LAUNCHED, "true");
      setIsFirstLaunch(false);
    } catch (error) {
      console.error("Error saving first launch:", error);
    }
  };
  
  const nextPage = () => {
    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };
  
  return (
    <View style={styles.onboardingContainer}>
      <View style={styles.pageContent}>
        <Text style={styles.pageTitle}>{onboardingPages[currentPage].title}</Text>
        <Text style={styles.pageDescription}>{onboardingPages[currentPage].description}</Text>
      </View>
      
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {onboardingPages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {currentPage === onboardingPages.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-rehearsal" 
        options={{ 
          title: "Add Rehearsal Task",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="add-rehearsal-event" 
        options={{ 
          title: "Add Rehearsal Event",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-rehearsal" 
        options={{ 
          title: "Edit Rehearsal Task",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-rehearsal-event" 
        options={{ 
          title: "Edit Rehearsal Event",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="add-practice" 
        options={{ 
          title: "Add Practice Task",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-practice" 
        options={{ 
          title: "Edit Practice Task",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="add-gig" 
        options={{ 
          title: "Add Gig",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-gig" 
        options={{ 
          title: "Edit Gig",
          presentation: "modal",
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: 24,
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pageDescription: {
    fontSize: 18,
    color: colors.subtext,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 26,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginRight: 8,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
