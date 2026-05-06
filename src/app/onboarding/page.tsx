import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingStep1 } from "@/components/app/onboarding-step1";
import { OnboardingStep2 } from "@/components/app/onboarding-step2";
import { OnboardingTopBar } from "@/components/app/onboarding-top-bar";
import { createClient } from "@/lib/supabase/server";
import type { Vertical } from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "Configura il tuo workspace",
};

const VERTICALS: Vertical[] = [
  "web_dev",
  "architect",
  "photographer",
  "accountant",
  "smm",
];

async function loadTemplateCounts(): Promise<Record<Vertical, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").select("vertical");

  const initial = VERTICALS.reduce<Record<Vertical, number>>((acc, v) => {
    acc[v] = 0;
    return acc;
  }, {} as Record<Vertical, number>);

  if (error || !data) return initial;

  for (const row of data) {
    const v = row.vertical as Vertical;
    if (v in initial) initial[v] += 1;
  }
  return initial;
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("vertical, full_name, vat_number, fiscal_regime")
    .eq("id", user.id)
    .maybeSingle();

  // Step 1 — manca verticale
  if (!profile?.vertical) {
    const counts = await loadTemplateCounts();
    return (
      <>
        <OnboardingTopBar currentStep={1} />
        <OnboardingStep1 templateCounts={counts} />
      </>
    );
  }

  // Step 2 — verticale OK ma mancano dati profilo
  if (!profile.full_name || !profile.vat_number || !profile.fiscal_regime) {
    return (
      <>
        <OnboardingTopBar currentStep={2} />
        <OnboardingStep2 />
      </>
    );
  }

  // Profilo completo → dashboard. Il primo workspace si crea dal dialog
  // "+ Nuovo workspace" della dashboard (Batch B), non più dall'onboarding.
  redirect("/dashboard");
}
