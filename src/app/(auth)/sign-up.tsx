import { useClerk } from "@clerk/expo";
import { useSignUp } from "@clerk/expo/legacy";
import { Link, useRouter } from "expo-router";
import { useFeatureFlag } from "posthog-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { joinWaitlist } = useClerk();
    const router = useRouter();
    const colors = useTheme();
    const isSignUpEnabled = useFeatureFlag("sign-up");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isButtonDisabled = isLoading || !isLoaded || isSignUpEnabled === undefined;

    const handleSubmit = async () => {
        if (!isLoaded) return;
        setIsLoading(true);
        try {
            if (isSignUpEnabled) {
                const result = await signUp.create({ emailAddress: email, password });
                if (result.status === "complete") {
                    await setActive({ session: result.createdSessionId });
                    router.replace("/(tabs)");
                }
            } else {
                await joinWaitlist({ emailAddress: email });
                Alert.alert("¡Listo!", "Te hemos agregado a la lista de espera.");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al registrarse";
            Alert.alert("Error", message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.inner}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.form}
                >
                    <ThemedText type="subtitle">Tu mayordomo personal</ThemedText>
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
                    {isSignUpEnabled && (
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
                            autoComplete="new-password"
                        />
                    )}
                    <Pressable
                        style={[
                            styles.button,
                            { backgroundColor: colors.accent },
                            isButtonDisabled && styles.buttonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={isButtonDisabled}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.accentDark} />
                        ) : (
                            <ThemedText type="default" themeColor="accentDark">
                                {isSignUpEnabled ? "Registrarse" : "Unirse a la lista de espera"}
                            </ThemedText>
                        )}
                    </Pressable>
                    <Link href="/(auth)/sign-in" asChild>
                        <Pressable style={styles.linkButton}>
                            <ThemedText type="small" themeColor="textSecondary">
                                ¿Ya tienes una cuenta?{" "}
                            </ThemedText>
                            <ThemedText type="smallBold" themeColor="accent">
                                Inicia sesión
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
        justifyContent: "center",
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
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.two,
    },
    buttonDisabled: { opacity: 0.6 },
    linkButton: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: Spacing.two,
    },
});
