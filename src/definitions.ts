declare module "@capacitor/core" {
  interface PluginRegistry {
    PWAFirebaseMsg: PWAFirebaseMsgPlugin;
  }
}

export interface PWAFirebaseMsgPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
