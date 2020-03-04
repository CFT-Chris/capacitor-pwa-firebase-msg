"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const fs_1 = require("fs");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const chalk = require("chalk");
// @ts-ignore
const capacitor_config_json_1 = require("../../../../capacitor.config.json");
const FIREBASECONFIGKEYS = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'vapidKey'];
const writeFileAsync = util_1.promisify(fs_1.writeFile);
const SERVICEWORKER_FILENAME = 'capacitor-pwa-firebase-msg-sw.js';
const FIREBASE_CONFIG_FILENAME = 'firebase.config.json';
const FIREBASE_APP_FILENAME = 'firebase-app.js';
const FIREBASE_MESSAGING_FILENAME = 'firebase-messaging.js';
const SERVICEWORKER_TEMPLATE = `
(function() {
  importScripts('./${FIREBASE_APP_FILENAME}');
  importScripts('./${FIREBASE_MESSAGING_FILENAME}');

  firebase.initializeApp({
    messagingSenderId: '[SENDER_ID]'
  });

  const messaging = firebase.messaging();

  self.addEventListener('push', (event) => {
    event.stopImmediatePropagation();
  });
  
  self.addEventListener('pushsubscriptionchange', e => {
    event.stopImmediatePropagation();
  });

  messaging.setBackgroundMessageHandler(msgPayload => {
    return messaging.sendMessageToWindowClients_(msgPayload);
  });
})();
`;
function logError(...args) {
    console.error(chalk.red('[error]'), ...args);
}
function logFatal(...args) {
    logError(...args);
    logError(`When the errors are fixed, reinstall this package: npm i capacitor-pwa-firebase-msg`);
    return process.exit(1);
}
function resolveNode(capacitorConfig, ...pathSegments) {
    const id = pathSegments[0];
    const path = pathSegments.slice(1);
    let modulePath;
    const starts = [capacitorConfig.app.rootDir];
    for (let start of starts) {
        modulePath = resolveNodeFrom(start, id);
        if (modulePath) {
            break;
        }
    }
    if (!modulePath) {
        return null;
    }
    return path_1.join(modulePath, ...path);
}
function resolveNodeFrom(start, id) {
    const rootPath = path_1.parse(start).root;
    let basePath = path_1.resolve(start);
    let modulePath;
    while (true) {
        modulePath = path_1.join(basePath, 'node_modules', id);
        if (fs_1.existsSync(modulePath)) {
            return modulePath;
        }
        if (basePath === rootPath) {
            return null;
        }
        basePath = path_1.dirname(basePath);
    }
}
async function generateServiceWorker(capacitorConfig, firebaseConfig) {
    const missingFirebaseValues = FIREBASECONFIGKEYS.filter(k => !firebaseConfig[k]);
    if (missingFirebaseValues.length > 0 && missingFirebaseValues.length < FIREBASECONFIGKEYS.length) {
        logFatal(`Firebase configuration missing: ${missingFirebaseValues.join(', ')}. `, 'Check your capacitor.config.json');
    }
    else {
        const serviceWorker = SERVICEWORKER_TEMPLATE.replace('[SENDER_ID]', firebaseConfig.messagingSenderId);
        const firebasePath = resolveNode(capacitorConfig, 'firebase', FIREBASE_APP_FILENAME);
        const firebaseMessagingPath = resolveNode(capacitorConfig, 'firebase', FIREBASE_MESSAGING_FILENAME);
        if (!firebasePath || !firebaseMessagingPath) {
            logFatal(`Unable to find required files in node_modules/firebase. Are you sure the firebase dependency is installed?`);
        }
        else {
            await writeFileAsync(path_1.join(capacitorConfig.app.webDirAbs, SERVICEWORKER_FILENAME), serviceWorker);
            await writeFileAsync(path_1.join(capacitorConfig.app.webDirAbs, FIREBASE_CONFIG_FILENAME), JSON.stringify(firebaseConfig, null, 2));
            await fs_extra_1.copy(firebasePath, path_1.join(capacitorConfig.app.webDirAbs, FIREBASE_APP_FILENAME));
            await fs_extra_1.copy(firebaseMessagingPath, path_1.join(capacitorConfig.app.webDirAbs, FIREBASE_MESSAGING_FILENAME));
        }
    }
}
if (!capacitor_config_json_1.default || !capacitor_config_json_1.default.app || !capacitor_config_json_1.default.app.plugins || !capacitor_config_json_1.default.app.plugins.PWAFirebaseMsg)
    logFatal('Firebase configuration missing under app.plugins.PWAFirebaseMsg inside of capacitor.config.json');
generateServiceWorker(capacitor_config_json_1.default, capacitor_config_json_1.default.app.plugins.PWAFirebaseMsg).then(() => {
    console.log(chalk.green('[success]'), `${SERVICEWORKER_FILENAME}, ${FIREBASE_CONFIG_FILENAME}, ${FIREBASE_APP_FILENAME} and ${FIREBASE_MESSAGING_FILENAME} saved to ${capacitor_config_json_1.default.app.webDirAbs}`);
}, (e) => {
    logFatal('Unable to write files to Capacitor web app directory', e);
});
