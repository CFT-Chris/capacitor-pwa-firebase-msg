import { WebPlugin } from '@capacitor/core';
import { PWAFirebaseMsgPlugin } from './definitions';

export class PWAFirebaseMsgWeb extends WebPlugin implements PWAFirebaseMsgPlugin {
  constructor() {
    super({
      name: 'PWAFirebaseMsg',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const PWAFirebaseMsg = new PWAFirebaseMsgWeb();

export { PWAFirebaseMsg };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(PWAFirebaseMsg);
