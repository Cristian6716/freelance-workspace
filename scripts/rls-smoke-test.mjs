// RLS smoke test — verifica che user A non possa leggere dati di user B.
// Esegui con: node --env-file=.env.local scripts/rls-smoke-test.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const stamp = Date.now();
  const userAEmail = `rls-test-a-${stamp}@example.com`;
  const userBEmail = `rls-test-b-${stamp}@example.com`;
  const password = "Test1234!";

  console.log("→ creating user A:", userAEmail);
  const { data: a, error: aErr } = await adminClient.auth.admin.createUser({
    email: userAEmail,
    password,
    email_confirm: true,
  });
  if (aErr || !a.user) throw aErr ?? new Error("user A not created");

  console.log("→ creating user B:", userBEmail);
  const { data: b, error: bErr } = await adminClient.auth.admin.createUser({
    email: userBEmail,
    password,
    email_confirm: true,
  });
  if (bErr || !b.user) throw bErr ?? new Error("user B not created");

  // Setup: dai a entrambi un profilo + workspace via service role
  await adminClient.from("profiles").upsert([
    {
      id: a.user.id,
      email: userAEmail,
      full_name: "User A",
      vertical: "web_dev",
      vat_number: "01234567897", // checksum-valid sample
      fiscal_regime: "forfettario",
    },
    {
      id: b.user.id,
      email: userBEmail,
      full_name: "User B",
      vertical: "web_dev",
      vat_number: "12345678903",
      fiscal_regime: "forfettario",
    },
  ]);

  const { data: wsA } = await adminClient
    .from("client_workspaces")
    .insert({
      owner_id: a.user.id,
      client_name: "Client of A",
      client_type: "private",
    })
    .select("id")
    .single();
  const { data: wsB } = await adminClient
    .from("client_workspaces")
    .insert({
      owner_id: b.user.id,
      client_name: "Client of B",
      client_type: "private",
    })
    .select("id")
    .single();

  console.log("→ workspace A id:", wsA?.id, "→ workspace B id:", wsB?.id);

  // Login come user A con il client anon
  const aClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: aSession, error: aSignIn } = await aClient.auth.signInWithPassword({
    email: userAEmail,
    password,
  });
  if (aSignIn || !aSession.session) throw aSignIn ?? new Error("A login failed");

  // Test 1: user A vede SOLO il proprio workspace
  const { data: aWorkspaces, error: aErr2 } = await aClient
    .from("client_workspaces")
    .select("id, client_name");
  if (aErr2) throw aErr2;
  console.log("user A sees workspaces:", aWorkspaces);
  const okIsolation =
    aWorkspaces?.length === 1 &&
    aWorkspaces[0]?.id === wsA?.id;
  console.log(okIsolation ? "✓ Test 1: workspace isolation OK" : "✗ Test 1: workspace LEAK!");

  // Test 2: user A non vede profile di B
  const { data: aProfiles } = await aClient
    .from("profiles")
    .select("id, email");
  console.log("user A sees profiles:", aProfiles);
  const okProfileIsolation =
    aProfiles?.length === 1 && aProfiles[0]?.id === a.user.id;
  console.log(okProfileIsolation ? "✓ Test 2: profile isolation OK" : "✗ Test 2: profile LEAK!");

  // Test 3: user A NON può inserire workspace per B
  const { error: insErr } = await aClient
    .from("client_workspaces")
    .insert({
      owner_id: b.user.id,
      client_name: "Hijack",
      client_type: "private",
    });
  console.log(
    insErr
      ? `✓ Test 3: cross-user insert blocked (${insErr.code})`
      : "✗ Test 3: cross-user INSERT was allowed!"
  );

  // Test 4: user A può vedere i 15 template
  const { data: tpls } = await aClient.from("templates").select("id");
  console.log(
    tpls?.length === 15
      ? `✓ Test 4: templates visible (${tpls.length})`
      : `✗ Test 4: expected 15 templates, got ${tpls?.length}`
  );

  // Cleanup
  await adminClient.from("client_workspaces").delete().in("id", [wsA?.id, wsB?.id]);
  await adminClient.auth.admin.deleteUser(a.user.id);
  await adminClient.auth.admin.deleteUser(b.user.id);
  console.log("→ cleanup done");

  const allOk = okIsolation && okProfileIsolation && !!insErr && tpls?.length === 15;
  if (!allOk) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
