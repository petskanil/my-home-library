import type { SupabaseClient } from "./client";

export async function signInWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  client: SupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(client: SupabaseClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getSession(client: SupabaseClient) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle(
  client: SupabaseClient,
  redirectTo: string,
  options?: { skipBrowserRedirect?: boolean },
) {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: options?.skipBrowserRedirect,
    },
  });
  if (error) throw error;
  return data;
}

/** Parse OAuth redirect URL and establish a Supabase session (Expo / deep links). */
export async function createSessionFromOAuthUrl(
  client: SupabaseClient,
  url: string,
) {
  const parsed = new URL(url);
  const params = Object.fromEntries(parsed.searchParams.entries());
  const hashParams = new URLSearchParams(
    parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash,
  );
  for (const [key, value] of hashParams.entries()) {
    if (!(key in params)) params[key] = value;
  }

  const errorParam = params.error_description ?? params.error;
  if (errorParam) throw new Error(errorParam);

  if (params.code) {
    const { data, error } = await client.auth.exchangeCodeForSession(
      params.code,
    );
    if (error) throw error;
    return data.session;
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (access_token && refresh_token) {
    const { data, error } = await client.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error("No auth credentials found in redirect URL");
}
