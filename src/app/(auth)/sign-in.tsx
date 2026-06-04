import { useSSO } from "@clerk/expo";
import { useSignIn } from "@clerk/expo/legacy";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import GoogleLogo from "@/assets/images/google-logo.svg";
import { AuthColors, Poppins, Radius, Spacing } from "@/constants/theme";

function useWarmUpBrowser() {
    useEffect(() => {
        if (Platform.OS !== "android") return;
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
}

export default function SignInScreen() {
    useWarmUpBrowser();
    const { isLoaded, signIn, setActive } = useSignIn();
    const { startSSOFlow } = useSSO();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleEmailSignIn = async () => {
        if (!isLoaded || !signIn || !setActive) return;
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const result = await signIn.create({ identifier: email, password });
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const redirectUrl = AuthSession.makeRedirectUri({
                path: "oauth-native-callback",
            });
            const { createdSessionId, setActive: setActiveSession } = await startSSOFlow({
                strategy: "oauth_google",
                redirectUrl,
            });
            if (createdSessionId && setActiveSession) {
                await setActiveSession({ session: createdSessionId });
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Error con Google");
        } finally {
            setIsLoading(false);
        }
    };

    const disabled = isLoading || !isLoaded;

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
                        <View style={styles.signUpBtnWrap}>
                            <Link href="/(auth)/sign-up" asChild>
                                <Pressable style={styles.signUpBtn}>
                                    <Text style={styles.signUpBtnText}>Registrarse</Text>
                                </Pressable>
                            </Link>
                        </View>
                        <View style={styles.logo}>
                            <LogoWhite width={156} height={106} />
                        </View>
                    </SafeAreaView>
                    <View style={styles.form}>
                        <Text style={styles.welcome}>Bienvenido</Text>
                        <Text style={styles.ctaDetails}>Ingresa tus detalles</Text>

                        <Pressable
                            style={[styles.googleBtn, disabled && styles.disabled]}
                            onPress={handleGoogleSignIn}
                            disabled={disabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={AuthColors.darkGray} />
                            ) : (
                                <>
                                    <GoogleLogo width={20} height={20} />
                                    <Text style={styles.googleBtnText}>
                                        Inicia sesión con Google
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>O inicia sesión con correo</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu correo electrónico"
                                placeholderTextColor={AuthColors.gray}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu contraseña"
                                placeholderTextColor={AuthColors.gray}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password"
                            />
                        </View>

                        {errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}

                        <Pressable
                            style={[styles.loginBtn, disabled && styles.disabled]}
                            onPress={handleEmailSignIn}
                            disabled={disabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={AuthColors.white} />
                            ) : (
                                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                            )}
                        </Pressable>

                        <Pressable style={styles.forgotPwdBtn}>
                            <Text style={styles.forgotPwdText}>¿Olvidaste tu contraseña?</Text>
                        </Pressable>
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
        paddingBottom: Spacing.five,
        gap: Spacing.five,
    },
    signUpBtnWrap: {
        alignSelf: "flex-end",
        paddingRight: Spacing.four,
        paddingTop: Spacing.three,
    },
    signUpBtn: {
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.18)",
    },
    signUpBtnText: { color: AuthColors.white, fontFamily: Poppins.semibold },
    logo: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.three,
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
        color: AuthColors.main,
        fontSize: 35,
        fontFamily: Poppins.bold,
        lineHeight: 38,
    },
    ctaDetails: {
        color: AuthColors.gray,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: Poppins.regular,
    },
    googleBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.two,
        height: 52,
        borderRadius: Radius.md,
        backgroundColor: AuthColors.background,
        borderWidth: 1,
        borderColor: AuthColors.lightGray,
        marginTop: Spacing.four,
    },
    googleBtnText: {
        color: AuthColors.darkGray,
        fontFamily: Poppins.semibold,
        fontSize: 15,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        marginTop: Spacing.three,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: AuthColors.gray },
    dividerText: {
        color: AuthColors.gray,
        fontSize: 14,
        fontFamily: Poppins.regular,
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
    loginBtn: {
        height: 52,
        borderRadius: Radius.md,
        backgroundColor: AuthColors.main,
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.one,
    },
    loginBtnText: { color: AuthColors.white, fontSize: 18, fontFamily: Poppins.bold },
    forgotPwdBtn: { alignSelf: "center", padding: Spacing.two },
    forgotPwdText: {
        color: AuthColors.darkGray,
        fontSize: 14,
        fontFamily: Poppins.regular,
    },
    disabled: { opacity: 0.6 },
});
