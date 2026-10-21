// The sea-time log at /log (DECISIONS.md A3). It opens the store on the
// device, says how many entries it holds and whether the phone is online, and
// works offline after one visit. The vessel and role screens live in
// src/log/screens.ts. Checking in and out comes in a later change.

import { enableOffline } from '../offline/offline';
import { NewerVersionOnDeviceError } from '../store/idb';
import { startScreens } from './screens';
import { openSeaLog, UnreadableEntryError, type SeaLog } from './store';

declare global {
  interface Window {
    /**
     * The open store, for the browser tests in e2e/log.spec.ts, as the game
     * exposes window.__captainsAcademy. It holds only this visitor's own data
     * on this device.
     */
    __seaTimeLog?: SeaLog;
  }
}

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`log/index.html has no #${id}.`);
  return found;
}

const network = element('network');
const entries = element('entries');

function showNetwork(): void {
  const online = navigator.onLine;
  network.dataset.state = online ? 'online' : 'offline';
  network.textContent = online ? 'Online' : 'Offline. The log still works here.';
}

type StoreState = 'ready' | 'blocked' | 'newer' | 'replaced' | 'unreadable';

function showStore(state: StoreState, text: string): void {
  entries.dataset.state = state;
  entries.textContent = text;
}

function entryCountText(count: number): string {
  if (count === 0) return 'No sea time logged yet.';
  if (count === 1) return '1 entry saved on this phone.';
  return `${count} entries saved on this phone.`;
}

async function start(): Promise<void> {
  showNetwork();
  window.addEventListener('online', showNetwork);
  window.addEventListener('offline', showNetwork);
  void enableOffline();

  try {
    const log = await openSeaLog({
      onReplaced: () =>
        showStore(
          'replaced',
          'The log was updated in another tab. Reload this page to keep using it.',
        ),
    });
    window.__seaTimeLog = log;
    const count = await log.count();
    entries.dataset.count = String(count);
    showStore('ready', entryCountText(count));
    startScreens(log);
    // Ask the browser not to clear the log when the device runs low on space.
    // Browsers may say no; the log still works, with that risk.
    void navigator.storage?.persist?.().catch(() => false);
  } catch (error) {
    if (error instanceof NewerVersionOnDeviceError) {
      showStore(
        'newer',
        'This log was saved by a newer version of the app. Reload the page to get it.',
      );
    } else if (error instanceof UnreadableEntryError) {
      showStore('unreadable', 'A saved entry could not be read. Nothing was changed or deleted.');
    } else {
      showStore(
        'blocked',
        "This browser won't let the log save anything. Private browsing often blocks it.",
      );
    }
  }
}

void start();
