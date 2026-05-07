import { redirect } from "next/navigation";

import { ConsumeMagicLink } from "@/components/client/consume-magic-link";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = {
  title: "Apertura workspace…",
  robots: { index: false, follow: false },
};

export default async function MagicLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    redirect("/client/expired?reason=invalid");
  }
  return <ConsumeMagicLink token={token} />;
}
