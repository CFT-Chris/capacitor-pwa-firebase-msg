var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { WebPlugin } from '@capacitor/core';
import { firebase } from '@firebase/app';
import '@firebase/messaging';
export class PWAFirebaseMsgWeb extends WebPlugin {
    constructor() {
        super({
            name: 'PushNotifications',
            platforms: ['web']
        });
    }
    echo(options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('ECHO', options);
            return options;
        });
    }
    ensureFirebase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.promiseFirebase) {
                this.promiseFirebase = new Promise((resolve, reject) => {
                    const jsonConfigRequest = new XMLHttpRequest();
                    jsonConfigRequest.overrideMimeType("application/json");
                    jsonConfigRequest.open('GET', 'firebase.config.json', true);
                    jsonConfigRequest.onreadystatechange = () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            if (jsonConfigRequest.readyState === 4) {
                                if (jsonConfigRequest.status === 200) {
                                    const config = JSON.parse(jsonConfigRequest.responseText);
                                    yield this.initializeFirebase(config);
                                    resolve();
                                }
                                else
                                    throw new Error(jsonConfigRequest.statusText);
                            }
                        }
                        catch (ex) {
                            reject('Could not parse capacitor configuration: ' + ex.message);
                        }
                    });
                    jsonConfigRequest.send(null);
                });
            }
            yield this.promiseFirebase;
        });
    }
    initializeFirebase(config) {
        return __awaiter(this, void 0, void 0, function* () {
            firebase.initializeApp(config);
            if (!firebase.messaging.isSupported())
                throw new Error('Firebase messaging is not supported');
            else {
                const registration = yield navigator.serviceWorker.ready;
                this.firebaseMessaging = firebase.messaging();
                this.firebaseMessaging.useServiceWorker(registration);
                yield Notification.requestPermission();
                this.firebaseMessaging.usePublicVapidKey(config.vapidKey);
                this.firebaseMessaging.onMessage((payload) => {
                    const pushNotification = {
                        data: payload.data,
                        id: '' // Leaving blank. Nothing unique can be extracted from onMessage payload.
                    };
                    if (payload.hasOwnProperty('notification')) {
                        pushNotification.title = payload.notification.title;
                        pushNotification.body = payload.notification.body;
                        this.notifyListeners('pushNotificationReceived', pushNotification);
                    }
                    else {
                        const pushNotificationActionPerformed = {
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
        });
    }
    getFirebaseToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const token = { value: yield this.firebaseMessaging.getToken() };
            this.notifyListeners('registration', token);
        });
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureFirebase();
            try {
                yield this.getFirebaseToken();
            }
            catch (ex) {
                console.error('Unable to get Firebase token', ex);
            }
        });
    }
    getDeliveredNotifications() {
        return Promise.reject('Method not implemented.');
    }
    removeDeliveredNotifications() {
        return Promise.reject('Method not implemented.');
    }
    removeAllDeliveredNotifications() {
        return Promise.reject('Method not implemented.');
    }
    createChannel() {
        return Promise.reject('Method not implemented.');
    }
    deleteChannel() {
        return Promise.reject('Method not implemented.');
    }
    listChannels() {
        return Promise.reject('Method not implemented.');
    }
}
const PWAFirebaseMsg = new PWAFirebaseMsgWeb();
export { PWAFirebaseMsg as PushNotifications };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(PWAFirebaseMsg);
//# sourceMappingURL=web.js.map