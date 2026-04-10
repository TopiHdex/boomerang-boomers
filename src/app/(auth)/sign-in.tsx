import { useOAuth } from '@clerk/expo';
import { useSignIn } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const colors = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!isLoaded || !signIn || !setActive) return;
    setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow();
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error con Google';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.form}>
          <ThemedText type="subtitle">Bienvenido</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Ingresa tus detalles
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.backgroundSelected,
                color: colors.text,
                backgroundColor: colors.backgroundElement,
              },
            ]}
            placeholder="Tu correo electrónico"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.backgroundSelected,
                color: colors.text,
                backgroundColor: colors.backgroundElement,
              },
            ]}
            placeholder="Tu contraseña"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.accent },
              (isLoading || !isLoaded) && styles.buttonDisabled,
            ]}
            onPress={handleEmailSignIn}
            disabled={isLoading || !isLoaded}>
            {isLoading ? (
              <ActivityIndicator color={colors.accentDark} />
            ) : (
              <ThemedText type="default" themeColor="accentDark">
                Iniciar Sesión
              </ThemedText>
            )}
          </Pressable>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.backgroundElement },
              (isLoading || !isLoaded) && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoading || !isLoaded}>
            <ThemedText type="default">Inicia sesión con Google</ThemedText>
          </Pressable>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.linkButton}>
              <ThemedText type="small" themeColor="textSecondary">
                ¿No tienes una cuenta?{' '}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="accent">
                Regístrate
              </ThemedText>
            </Pressable>
          </Link>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: { opacity: 0.6 },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
