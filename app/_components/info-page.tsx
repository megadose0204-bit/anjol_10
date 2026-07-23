import Link from 'next/link'

interface InfoPageProps {
  title: string
  children: React.ReactNode
}

export default function InfoPage({ title, children }: InfoPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black text-indigo-600 tracking-tight flex-shrink-0 no-underline">
            AutoBlog
          </Link>
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">
            홈으로
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[720px] w-full mx-auto px-6 py-16">
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">{title}</h1>
        <div className="text-sm text-zinc-600 leading-relaxed space-y-4">{children}</div>
      </main>

      <footer className="border-t border-[var(--border)] bg-zinc-50">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-lg font-extrabold text-zinc-900 tracking-tight">DevFlow</span>
          <nav className="flex items-center gap-6">
            <Link href="/docs" className="text-sm text-zinc-500 hover:text-zinc-900 no-underline transition-colors">문서</Link>
            <Link href="/changelog" className="text-sm text-zinc-500 hover:text-zinc-900 no-underline transition-colors">변경 내역</Link>
            <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-900 no-underline transition-colors">개인정보 처리방침</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
