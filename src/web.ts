import { WebPlugin } from '@capacitor/core';
import { firebase } from '@firebase/app';
import '@firebase/messaging';

import {
  PushNotificationsPlugin, 
  PushNotificationDeliveredList,
  NotificationChannelList,
  PushNotificationToken,
  PushNotification,
  PushNotificationActionPerformed,
  NotificationPermissionResponse
} from '@capacitor/core/dist/esm/core-plugin-definitions';

export class PWAFirebaseMsgWeb extends WebPlugin implements PushNotificationsPlugin {
  private promiseFirebase: Promise<void>;
  private firebaseMessaging: any;
  private permissionGranted: boolean = false;

  constructor() {
    super({
      name: 'PushNotifications',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }

  private async ensureFirebase() {
    if (!this.promiseFirebase) {
      this.promiseFirebase = new Promise((resolve, reject) => {
        const jsonConfigRequest = new XMLHttpRequest();

        jsonConfigRequest.overrideMimeType("application/json");
        jsonConfigRequest.open('GET', 'firebase.config.json', true);
        jsonConfigRequest.onreadystatechange = async () => {
          try {
            if (jsonConfigRequest.readyState === 4) {
              if (jsonConfigRequest.status === 200) {
                const config = JSON.parse(jsonConfigRequest.responseText);

                await this.initializeFirebase(config);

                resolve();
              }
              else
                throw new Error(jsonConfigRequest.statusText);
            }
          }
          catch (ex) {
            reject('Could not parse capacitor configuration: ' + ex.message);
          }
        };

        jsonConfigRequest.send(null);
      });
    }

    await this.promiseFirebase;
  }

  private async initializeFirebase(config: any) {
    firebase.initializeApp(config);

    if (!firebase.messaging.isSupported())
      throw new Error('Firebase messaging is not supported');
    else {
      const registration = await navigator.serviceWorker.ready;
      
      this.firebaseMessaging = firebase.messaging();
      this.firebaseMessaging.useServiceWorker(registration);

      await this.requestPermission();
      
      this.firebaseMessaging.usePublicVapidKey(config.vapidKey);

      this.firebaseMessaging.onMessage((payload: any) => {
        const pushNotification: PushNotification = {
          data: payload.data,
          id: '' // Leaving blank. Nothing unique can be extracted from onMessage payload.
        };
        
        if (payload.hasOwnProperty('notification')) {
          pushNotification.title = payload.notification.title;
          pushNotification.body = payload.notification.body;

          this.notifyListeners('pushNotificationReceived', pushNotification);
        }
        else {
          const pushNotificationActionPerformed: PushNotificationActionPerformed = {
            notification: pushNotification,
            actionId: 'tap'
          };

          this.notifyListeners('pushNotificationActionPerformed', pushNotificationActionPerformed);
        }
      });

      this.firebaseMessaging.onTokenRefresh(() => { 
        this.getFirebaseToken();      
      });
    }
  }

  private async getFirebaseToken() {
    const token: PushNotificationToken = { value: await this.firebaseMessaging.getToken() };

    this.notifyListeners('registration', token);
  }

  async register(): Promise<void> {
    await this.ensureFirebase();

    try {
      await this.getFirebaseToken();
    }
    catch (ex) {
      this.notifyListeners('registrationError', ex);
    }
  }

  getDeliveredNotifications(): Promise<PushNotificationDeliveredList> {
    return Promise.reject('Method not implemented.');
  }

  removeDeliveredNotifications(): Promise<void> {
    return Promise.reject('Method not implemented.');
  }

  removeAllDeliveredNotifications(): Promise<void> {
    return Promise.reject('Method not implemented.');
  }

  createChannel(): Promise<void> {
    return Promise.reject('Method not implemented.');
  }

  deleteChannel(): Promise<void> {
    return Promise.reject('Method not implemented.');
  }

  listChannels(): Promise<NotificationChannelList> {
    return Promise.reject('Method not implemented.');
  }

  requestPermission(): Promise<NotificationPermissionResponse> {
    return new Promise(async (resolve) => {
      if (this.permissionGranted)
        resolve({ granted: true });
      else {
        try {
          await Notification.requestPermission();
          this.permissionGranted = true;
        }
        catch (ex) {
          this.permissionGranted = false;
        }
        finally {
          resolve({ granted: this.permissionGranted });
        }
      }
    });
  }

}


const PWAFirebaseMsg = new PWAFirebaseMsgWeb();

export { PWAFirebaseMsg as PushNotifications };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(PWAFirebaseMsg);
