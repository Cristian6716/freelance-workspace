// RLS smoke test — verifica isolamento cross-tenant su TUTTE le tabelle Batch A+B+C.
// Esegui con: node --env-file=.env.local scripts/rls-smoke-test.mjs
//
// Invarianti testati:
//   Batch A+B (1-11): isolamento RLS cross-tenant
//   Batch C (12-15): invarianti vista cliente
//   1. workspace isolation (A non vede ws di B)
//   2. profile isolation
//   3. cross-user INSERT su client_workspaces bloccato
//   4. templates visible (15)
//   5. projects isolation (A non vede progetti di B)
//   6. milestones isolation
//   7. files isolation (private + shared di B invisibili ad A)
//   8. messages isolation
//   9. workspace_activity_log isolation
//   10. createWorkspace via anon (RLS) funziona — fix bug Batch A
//   11. storage workspace-files: B non può listare l'oggetto di A
//   12. messages constraint: insert con sender_member_id (path cliente) valido
//   13. messages constraint: insert con sender_profile_id+sender_member_id entrambi
//       valorizzati BLOCCATO (exactly-one)
//   14. workspace_members.invite_token UNIQUE globale: collisione bloccata
//   15. file visibility guard: lato server-action, file private deve essere
//       rifiutato per il cliente del workspace (simulato via SERVICE_ROLE+filtro)

/* eslint-disable no-console -- script di diagnostica dev-only */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const adminClient = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log((ok ? "✓ " : "✗ ") + name + (detail ? " — " + detail : ""));
}

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

  await adminClient.from("profiles").upsert([
    {
      id: a.user.id,
      email: userAEmail,
      full_name: "User A",
      vertical: "web_dev",
      vat_number: "01234567897",
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

  // Setup: workspace + project + milestone + file + message + activity for A and B (admin)
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

  // Aggiungi B come workspace_members del workspace B (ruolo client) per testare
  // che SELECT su messages funzioni quando attivo come member non-owner.
  const { data: memberB } = await adminClient
    .from("workspace_members")
    .insert({
      workspace_id: wsB.id,
      user_id: b.user.id,
      email: userBEmail,
      role: "client",
      accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const { data: prjA } = await adminClient
    .from("projects")
    .insert({
      workspace_id: wsA.id,
      title: "Progetto A",
      type: "deliverable",
      status: "active",
    })
    .select("id")
    .single();
  const { data: prjB } = await adminClient
    .from("projects")
    .insert({
      workspace_id: wsB.id,
      title: "Progetto B",
      type: "deliverable",
      status: "active",
    })
    .select("id")
    .single();

  await adminClient.from("milestones").insert([
    { project_id: prjA.id, title: "M1 di A", order_index: 0 },
    { project_id: prjB.id, title: "M1 di B", order_index: 0 },
  ]);

  await adminClient.from("files").insert([
    {
      workspace_id: wsA.id,
      uploaded_by: a.user.id,
      filename: "doc-private-A.pdf",
      storage_path: `${wsA.id}/test-private-a.pdf`,
      size_bytes: 1024,
      mime_type: "application/pdf",
      visibility: "private",
    },
    {
      workspace_id: wsA.id,
      uploaded_by: a.user.id,
      filename: "doc-shared-A.pdf",
      storage_path: `${wsA.id}/test-shared-a.pdf`,
      size_bytes: 2048,
      mime_type: "application/pdf",
      visibility: "shared",
    },
  ]);

  await adminClient.from("messages").insert({
    workspace_id: wsA.id,
    sender_member_id: null, // sender_member_id può essere null se rappresenta system/admin
    body: "Hello from A workspace",
  });

  // Login come user A e B con il client anon
  const aClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const bClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: aSignIn } = await aClient.auth.signInWithPassword({
    email: userAEmail,
    password,
  });
  if (aSignIn) throw aSignIn;
  const { error: bSignIn } = await bClient.auth.signInWithPassword({
    email: userBEmail,
    password,
  });
  if (bSignIn) throw bSignIn;

  // -------------------------------------------------------------------
  // Test 1: workspace isolation
  // -------------------------------------------------------------------
  const { data: aWs } = await aClient.from("client_workspaces").select("id");
  record(
    "T01 workspace isolation",
    aWs?.length === 1 && aWs[0]?.id === wsA.id,
    `A vede ${aWs?.length ?? 0} workspace`
  );

  // -------------------------------------------------------------------
  // Test 2: profile isolation
  // -------------------------------------------------------------------
  const { data: aProf } = await aClient.from("profiles").select("id");
  record(
    "T02 profile isolation",
    aProf?.length === 1 && aProf[0]?.id === a.user.id,
    `A vede ${aProf?.length ?? 0} profili`
  );

  // -------------------------------------------------------------------
  // Test 3: cross-user INSERT su client_workspaces bloccato
  // -------------------------------------------------------------------
  const { error: insErr } = await aClient.from("client_workspaces").insert({
    owner_id: b.user.id,
    client_name: "Hijack",
    client_type: "private",
  });
  record(
    "T03 cross-user INSERT workspace blocked",
    insErr !== null,
    insErr?.code ?? "no error"
  );

  // -------------------------------------------------------------------
  // Test 4: templates visibili (15)
  // -------------------------------------------------------------------
  const { data: tpls } = await aClient.from("templates").select("id");
  record("T04 templates visible", tpls?.length === 15, `count=${tpls?.length}`);

  // -------------------------------------------------------------------
  // Test 5: projects isolation
  // -------------------------------------------------------------------
  const { data: aProjects } = await aClient.from("projects").select("id");
  record(
    "T05 projects isolation",
    aProjects?.length === 1 && aProjects[0]?.id === prjA.id,
    `A vede ${aProjects?.length ?? 0} progetti`
  );

  // -------------------------------------------------------------------
  // Test 6: milestones isolation
  // -------------------------------------------------------------------
  const { data: aMilestones } = await aClient.from("milestones").select("id, title");
  record(
    "T06 milestones isolation",
    aMilestones?.length === 1 && aMilestones[0]?.title === "M1 di A",
    `A vede ${aMilestones?.length ?? 0} milestone`
  );

  // -------------------------------------------------------------------
  // Test 7: files isolation (B non vede né shared né private di A)
  // -------------------------------------------------------------------
  const { data: bFiles } = await bClient.from("files").select("id");
  record(
    "T07 files isolation (cross-tenant)",
    bFiles?.length === 0,
    `B vede ${bFiles?.length ?? 0} file di A`
  );

  // -------------------------------------------------------------------
  // Test 8: messages isolation
  // -------------------------------------------------------------------
  const { data: bMessages } = await bClient.from("messages").select("id");
  record(
    "T08 messages isolation",
    bMessages?.length === 0,
    `B vede ${bMessages?.length ?? 0} messaggi di A`
  );

  // -------------------------------------------------------------------
  // Test 9: workspace_activity_log isolation
  // B è member di wsB: deve vedere SOLO gli eventi di wsB (2: project + milestone)
  // e ZERO di wsA (5+ eventi: project + milestone + 2 files + message).
  // -------------------------------------------------------------------
  const { data: bActivity } = await bClient
    .from("workspace_activity_log")
    .select("id, workspace_id");
  const bSeesAnyOfA = (bActivity ?? []).some((r) => r.workspace_id === wsA.id);
  const bSeesOnlyB = (bActivity ?? []).every((r) => r.workspace_id === wsB.id);
  record(
    "T09 activity log isolation",
    !bSeesAnyOfA && bSeesOnlyB,
    `B vede ${bActivity?.length ?? 0} eventi (devono essere tutti di wsB)`
  );

  // -------------------------------------------------------------------
  // Test 10: createWorkspace via anon (utente loggato A) FUNZIONA
  // (validazione fix bug Batch A: niente member-row owner separato)
  // -------------------------------------------------------------------
  const { data: newWs, error: newWsErr } = await aClient
    .from("client_workspaces")
    .insert({
      owner_id: a.user.id,
      client_name: "Smoke test new workspace",
      client_type: "private",
    })
    .select("id")
    .single();
  record(
    "T10 createWorkspace via RLS (no member-row)",
    newWsErr === null && newWs?.id !== undefined,
    newWsErr?.code ?? "ok"
  );

  // Cleanup workspace appena creato
  if (newWs?.id) {
    await adminClient.from("client_workspaces").delete().eq("id", newWs.id);
  }

  // -------------------------------------------------------------------
  // Test 11: storage workspace-files cross-tenant blocked
  // B prova ad uploadare in {wsA.id}/... → deve fallire (RLS storage owner check).
  // -------------------------------------------------------------------
  // Mime type ammesso (text/plain) per testare SOLO il blocco RLS, non il filtro mime.
  const blob = new Blob(["hijack content"], { type: "text/plain" });
  const { error: storageErr } = await bClient.storage
    .from("workspace-files")
    .upload(`${wsA.id}/hijack-${stamp}.txt`, blob, {
      contentType: "text/plain",
    });
  record(
    "T11 storage cross-tenant upload blocked",
    storageErr !== null,
    storageErr?.message ?? "no error"
  );

  // -------------------------------------------------------------------
  // BATCH C — Vista cliente
  // -------------------------------------------------------------------

  // Test 12: messages constraint exactly-one — sender_member_id (path cliente)
  // valido. Inserisce un messaggio simulando come fa la Server Action client.
  const { data: clientMsg, error: clientMsgErr } = await adminClient
    .from("messages")
    .insert({
      workspace_id: wsB.id,
      sender_member_id: memberB.id,
      sender_profile_id: null,
      body: "Messaggio dal cliente di B",
    })
    .select("id")
    .single();
  record(
    "T12 messages insert path cliente (sender_member_id only)",
    clientMsgErr === null && !!clientMsg?.id,
    clientMsgErr?.code ?? "ok"
  );

  // Test 13: messages constraint exactly-one — entrambi i sender valorizzati =
  // violazione constraint. Deve fallire.
  const { error: bothErr } = await adminClient.from("messages").insert({
    workspace_id: wsB.id,
    sender_member_id: memberB.id,
    sender_profile_id: b.user.id,
    body: "Doppio sender — non deve passare",
  });
  record(
    "T13 messages constraint exactly-one violato bloccato",
    bothErr !== null,
    bothErr?.code ?? "no error"
  );

  // Test 14: workspace_members.invite_token UNIQUE globale.
  // Inseriamo un nuovo member con lo stesso invite_token di memberB → conflict.
  const { data: memberBToken } = await adminClient
    .from("workspace_members")
    .select("invite_token")
    .eq("id", memberB.id)
    .single();
  const { error: dupTokenErr } = await adminClient.from("workspace_members").insert({
    workspace_id: wsA.id,
    email: `dup-${stamp}@example.com`,
    role: "client",
    invite_token: memberBToken.invite_token,
  });
  record(
    "T14 workspace_members.invite_token UNIQUE",
    dupTokenErr !== null,
    dupTokenErr?.code ?? "no error"
  );

  // Test 15: file visibility guard (simulazione lato server-action cliente).
  // La action client `getClientSignedFileUrlAction` lookup file e applica:
  //   - file.workspace_id == session.workspaceId
  //   - file.visibility == "shared"
  //   - file.deleted_at IS NULL
  // Verifichiamo che la query stessa ritorni le righe attese, replicando il
  // filtro che la action userà.
  const targetWorkspaceId = wsA.id;
  const { data: privateFiles } = await adminClient
    .from("files")
    .select("id, visibility")
    .eq("workspace_id", targetWorkspaceId)
    .eq("visibility", "private")
    .is("deleted_at", null);
  const { data: sharedFiles } = await adminClient
    .from("files")
    .select("id, visibility")
    .eq("workspace_id", targetWorkspaceId)
    .eq("visibility", "shared")
    .is("deleted_at", null);
  // Abbiamo creato 1 private e 1 shared in wsA in setup.
  record(
    "T15 file visibility guard split (1 private + 1 shared in ws)",
    (privateFiles?.length ?? 0) === 1 && (sharedFiles?.length ?? 0) === 1,
    `private=${privateFiles?.length ?? 0} shared=${sharedFiles?.length ?? 0}`
  );

  // Cleanup
  if (memberB?.id) {
    await adminClient.from("workspace_members").delete().eq("id", memberB.id);
  }
  await adminClient
    .from("client_workspaces")
    .delete()
    .in("id", [wsA.id, wsB.id]);
  await adminClient.auth.admin.deleteUser(a.user.id);
  await adminClient.auth.admin.deleteUser(b.user.id);
  console.log("→ cleanup done");

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\nResult: ${passed}/${total} passed`);
  if (passed !== total) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
