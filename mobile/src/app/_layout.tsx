import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");

      console.log("🔐 Customer token:", token ? "FOUND" : "NOT FOUND");

      if (!token) {
        // User logged out hai
        setCheckingAuth(false);
        await SplashScreen.hideAsync();
        return;
      }

      // Token mila = user already logged in hai
      setCheckingAuth(false);
      await SplashScreen.hideAsync();

    } catch (error) {
      console.log("AUTH CHECK ERROR:", error);
      setCheckingAuth(false);
      await SplashScreen.hideAsync();
    }
  };

  if (checkingAuth) {
    return null;
  }

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="my-orders" />
        <Stack.Screen name="order-details" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="help-support"/>
      </Stack>
    </ThemeProvider>
  );
}