import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) return null;

    return <Redirect href={isSignedIn ? "/(tabs)" : "/(auth)/sign-in"} />;
}
