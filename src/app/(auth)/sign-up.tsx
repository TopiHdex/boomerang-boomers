import { useClerk } from "@clerk/expo";
import { useSignUp } from "@clerk/expo/legacy";
import { Link, useRouter } from "expo-router";
import { useFeatureFlag } from "posthog-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LogoWhite from "@/assets/images/logo-white.svg";
import { AuthColors, Poppins, Radius, Spacing } from "@/constants/theme";

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { joinWaitlist } = useClerk();
    const router = useRouter();
    const isSignUpEnabled = useFeatureFlag("sign-up");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const disabled = isLoading || !isLoaded || isSignUpEnabled === undefined;

    const handleSubmit = async () => {
        if (!isLoaded) return;
        setIsLoading(true);
        setErrorMsg(null);
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
                setEmail("");
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Error al registrarse");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("@/assets/images/fruits.png")}
            style={styles.bg}
            imageStyle={styles.bgImage}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <SafeAreaView style={styles.header} edges={["top"]}>
                        <LogoWhite width={82} height={56} />
                    </SafeAreaView>
                    <View style={styles.form}>
                        <Text style={styles.welcome}>Tu mayordomo personal</Text>

                        <View style={styles.field}>
                            <Text style={styles.label}>Correo electrónico</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="hola@boomerang.com"
                                placeholderTextColor={AuthColors.gray}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>

                        {isSignUpEnabled && (
                            <View style={styles.field}>
                                <Text style={styles.label}>Contraseña</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu contraseña"
                                    placeholderTextColor={AuthColors.gray}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoComplete="new-password"
                                />
                            </View>
                        )}

                        {errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}

                        <Pressable
                            style={[styles.submitBtn, disabled && styles.disabled]}
                            onPress={handleSubmit}
                            disabled={disabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={AuthColors.white} />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {isSignUpEnabled
                                        ? "Registrarse"
                                        : "Unirse a la lista de espera"}
                                </Text>
                            )}
                        </Pressable>

                        <Link href="/(auth)/sign-in" asChild>
                            <Pressable style={styles.signInLink}>
                                <Text style={styles.signInLinkText}>
                                    ¿Ya tienes una cuenta?{" "}
                                    <Text style={styles.signInLinkAccent}>Inicia sesión</Text>
                                </Text>
                            </Pressable>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: AuthColors.main },
    bgImage: { top: -200 },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: Spacing.five,
    },
    form: {
        backgroundColor: AuthColors.background,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        padding: 32,
        paddingTop: 43,
        gap: Spacing.three,
    },
    welcome: {
        color: AuthColors.font,
        fontSize: 25,
        fontFamily: Poppins.bold,
        lineHeight: 38,
        marginBottom: Spacing.three,
    },
    field: { gap: 6 },
    label: { color: AuthColors.darkGray, fontSize: 13, fontFamily: Poppins.medium },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: AuthColors.lightGray,
        borderRadius: Radius.sm,
        paddingHorizontal: Spacing.three,
        fontSize: 16,
        color: AuthColors.font,
        backgroundColor: AuthColors.white,
        fontFamily: Poppins.regular,
    },
    errorMsg: {
        color: AuthColors.redFont,
        backgroundColor: AuthColors.redBg,
        borderColor: AuthColors.redOutline,
        borderWidth: 1,
        borderRadius: Radius.sm,
        padding: Spacing.two,
        fontSize: 13,
        fontFamily: Poppins.regular,
    },
    submitBtn: {
        height: 52,
        borderRadius: Radius.md,
        backgroundColor: AuthColors.main,
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.one,
    },
    submitBtnText: {
        color: AuthColors.white,
        fontSize: 18,
        fontFamily: Poppins.bold,
    },
    signInLink: { alignSelf: "center", padding: Spacing.two },
    signInLinkText: {
        color: AuthColors.darkGray,
        fontSize: 16,
        fontFamily: Poppins.regular,
    },
    signInLinkAccent: { color: AuthColors.main, textDecorationLine: "underline" },
    disabled: { opacity: 0.6 },
});
