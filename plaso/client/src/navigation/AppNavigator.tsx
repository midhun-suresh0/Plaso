import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailsScreen from '../screens/PostDetailsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SavedPostsScreen from '../screens/SavedPostsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SearchScreen from '../screens/SearchScreen';
import { colors, theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigation structure.
 * Handles authenticated vs unauthenticated flows.
 */
export default function AppNavigator(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PostDetails"
              component={PostDetailsScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SavedPosts"
              component={SavedPostsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Unauthenticated Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyOtp"
              component={VerifyOtpScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
