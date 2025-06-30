import React, { Suspense, lazy } from "react";
import { Tabs } from "expo-router";
import { LoadingState } from "@/components/LoadingState";
import { styled } from "nativewind";
import { Music, Calendar, BookOpen } from "lucide-react-native";
import { colors } from "@/constants/colors"; // We'll use Tailwind classes primarily

const StyledTabs = styled(Tabs);

export default function TabLayout() {
  // Lazy load tab screens for better performance
  const LazyRehearsalScreen = lazy(() => import('./index'));
  const LazyPracticeScreen = lazy(() => import('./practice'));
  const LazyGigsScreen = lazy(() => import('./gigs'));

  const LazyScreenWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<LoadingState />}>
      {children}
    </Suspense>
  );

  return (
    <StyledTabs
      // Apply global styling to the Tabs container if possible
      // className="bg-background" // Example: This would style the container of Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary, // Uses theme color
        tabBarInactiveTintColor: colors.subtext, // Uses theme color
        tabBarStyle: { // Remains a style object
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          elevation: 0, // Keep for Android shadow control
          shadowOpacity: 0, // Keep for iOS shadow control
          // NativeWind equivalent: "border-t border-border bg-background shadow-none"
        },
        tabBarLabelStyle: { // Remains a style object
          fontSize: 12, // NativeWind: "text-xs"
          fontWeight: '500', // NativeWind: "font-medium"
        },
        headerStyle: { // Remains a style object
          backgroundColor: colors.background,
          shadowColor: 'transparent', // Or colors.background to blend
          elevation: 0,
          // NativeWind equivalent: "bg-background shadow-none"
        },
        headerTitleStyle: { // Remains a style object
          fontWeight: '600', // NativeWind: "font-semibold"
          fontSize: 18, // NativeWind: "text-lg"
        },
        headerTintColor: colors.text, // Uses theme color
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Rehearsal",
          tabBarIcon: ({ color }) => <Music size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gigs"
        options={{
          title: "Gigs",
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
