// The front page at / (issue #37). It is plain links; this keeps an offline
// copy of it, as the game and the sea-time log keep theirs, and shows the
// optional Account link (issue #87) when the build has Supabase settings.

import { authConfig } from '../auth/config';
import { enableOffline } from '../offline/offline';

void enableOffline();

if (authConfig) void showAccountLink();

async function showAccountLink(): Promise<void> {
  const item = document.getElementById('account-item');
  const status = document.getElementById('account-status');
  if (!item || !status) return;
  item.hidden = false;
  try {
    // Loaded only when sign-in is set up, so a build without it ships no client here.
    const { supabase } = await import('../auth/client');
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const email = session?.user.is_anonymous === true ? undefined : session?.user.email;
    if (email) status.textContent = `Signed in as ${email}`;
  } catch {
    // Offline before the client was ever cached: the link still works.
  }
}
