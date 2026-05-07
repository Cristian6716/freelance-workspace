type Props = {
  /** False per tier studio (white-label completo). */
  showAttribution: boolean;
};

export function ClientFooter({ showAttribution }: Props) {
  return (
    <footer className="mt-auto w-full border-t border-outline-variant/30 bg-surface-container-low">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-on-surface-variant sm:flex-row sm:px-6">
        <p className="text-center">
          {showAttribution ? "Workspace gestito con [NOME_APP]" : " "}
        </p>
        <ul className="flex items-center gap-4">
          <li>
            <a
              href="mailto:?subject=Aiuto%20workspace"
              className="hover:text-foreground transition-colors"
            >
              Aiuto
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
