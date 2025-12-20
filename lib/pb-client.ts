import PocketBase from 'pocketbase';

export function createPocketBaseClient() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.rdev.cloud');
  pb.autoCancellation(false);
  return pb;
}

export async function createAdminClient() {
  const pb = createPocketBaseClient();
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;
  
  if (!email || !pass) {
    // Fail silently or throw depending on need. For admin actions, throwing is safer than running unauthenticated.
    // However, original code checked 'if (email && pass)'.
    // If credentials are missing, we can't do admin operations.
    throw new Error('PB_ADMIN_EMAIL or PB_ADMIN_PASS is not set in environment variables.');
  }
  
  await pb.admins.authWithPassword(email, pass);
  return pb;
}
