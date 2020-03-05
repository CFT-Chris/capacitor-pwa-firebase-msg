import { PushNotificationsPlugin } from "@capacitor/core";
declare module "@capacitor/core" {
    interface PluginRegistry {
        PWAFirebaseMsg: PushNotificationsPlugin;
    }
}
