import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <header className="w-full px-gutter py-6">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <span className="font-heading text-xl font-medium tracking-tight">
            [NOME_APP]
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-gutter pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}
