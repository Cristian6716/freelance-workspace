import { redirect } from "next/navigation";

/**
 * Root entry. La marketing homepage arriverà in Batch F.
 * Il middleware reindirizza utenti autenticati a /dashboard o /onboarding;
 * gli ospiti finiscono qui e li mandiamo a /signin.
 */
export default function HomePage() {
  redirect("/signin");
}
