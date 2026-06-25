import Link from "next/link";

export function Header() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 text-teal-600">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.svg"
          alt=""
          width={36}
          height={28}
          className="text-teal-600"
          aria-hidden
        />
        <div>
          <span className="text-lg font-semibold tracking-tight">Cascade</span>
          <p className="text-xs text-neutral-500">allocate before you spend.</p>
        </div>
      </Link>
      <Link
        href="/setup"
        className="text-sm text-neutral-600 hover:text-teal-600"
      >
        Setup
      </Link>
    </header>
  );
}
