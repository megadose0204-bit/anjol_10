'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, 
  PenSquare, 
  Sparkles, 
  Clock, 
  User, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageSquare, 
  Bookmark,
  TrendingUp,
  SlidersHorizontal,
  Code
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Category {
  id: number
  name: string
  slug: string
}

interface Author {
  id: number
  name: string
  role: string
  avatar_url: string | null
}

interface Post {
  id: number
  title: string
  excerpt: string
  published_at: string
  reading_minutes?: number
  like_count?: number
  author_id?: number
  author?: Author | null
  categories?: Category[]
}

const SAMPLE_POSTS: Post[] = [
  {
    id: 1,
    title: 'Mastering State Management in Modern React Applications',
    excerpt: 'State management remains one of the most debated topics in the React ecosystem. In this post, we dive deep into modern approaches like Zustand, Jotai, and React Query.',
    published_at: '2024-10-24T00:00:00Z',
    reading_minutes: 8,
    like_count: 128,
    author: { id: 1, name: 'Alex Chen', role: 'Senior Frontend Architect', avatar_url: null },
    categories: [{ id: 1, name: 'React', slug: 'react' }]
  },
  {
    id: 2,
    title: 'Building Resilient Microservices with Go and gRPC',
    excerpt: 'Explore best practices for designing scalable, type-safe RPC endpoints using protocol buffers and distributed tracing in Golang.',
    published_at: '2024-10-22T00:00:00Z',
    reading_minutes: 12,
    like_count: 94,
    author: { id: 2, name: 'Sarah Jenkins', role: 'Backend Lead', avatar_url: null },
    categories: [{ id: 2, name: 'Backend', slug: 'backend' }]
  },
  {
    id: 3,
    title: 'Rust Ownership and Memory Safety Without Garbage Collection',
    excerpt: 'Understanding borrows, lifetimes, and why Rust enables high performance zero-cost abstractions for system level engineering.',
    published_at: '2024-10-19T00:00:00Z',
    reading_minutes: 10,
    like_count: 215,
    author: { id: 3, name: 'Mike Kim', role: 'Systems Engineer', avatar_url: null },
    categories: [{ id: 3, name: 'Rust', slug: 'rust' }]
  },
  {
    id: 4,
    title: 'Optimizing Next.js App Router & Server Components Performance',
    excerpt: 'How streaming SSR, partial prerendering, and parallel routes change web development patterns in modern Jamstack architecture.',
    published_at: '2024-10-15T00:00:00Z',
    reading_minutes: 6,
    like_count: 76,
    author: { id: 4, name: 'Elena Rostova', role: 'Fullstack Dev', avatar_url: null },
    categories: [{ id: 1, name: 'React', slug: 'react' }]
  }
]

export default function HomePage() {
  const supabase = useMemo(() => createClient(), [])

  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS)
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'All', slug: 'all' },
    { id: 2, name: 'React', slug: 'react' },
    { id: 3, name: 'TypeScript', slug: 'typescript' },
    { id: 4, name: 'Architecture', slug: 'architecture' },
    { id: 5, name: 'Backend', slug: 'backend' },
    { id: 6, name: 'Rust', slug: 'rust' }
  ])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPosts() {
      try {
        const { data } = await supabase.from('posts').select('*').order('published_at', { ascending: false })
        if (data && data.length > 0) {
          setPosts(data)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadPosts()
  }, [supabase])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || 
                              post.categories?.some(c => c.name.toLowerCase() === activeCategory.toLowerCase()) ||
                              activeCategory === 'React'
      return matchesSearch && matchesCategory
    })
  }, [posts, searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#0B0F17]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">DevLog</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link href="/" className="text-white hover:text-indigo-400 transition-colors">Explore</Link>
              <Link href="/community" className="hover:text-white transition-colors">Community</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Guide</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block w-48 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <Link 
              href="/write"
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <PenSquare size={13} />
              Write
            </Link>
            <Link 
              href="/auth"
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section ── */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
              <Sparkles size={13} />
              <span>DevLog Developer Insights</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4">
              Thoughts, Stories &amp; Ideas.
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
              Modern frontend architecture, state management strategies, and system design patterns curated for developers.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat.name
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Article Cards Grid ── */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/posts/${post.id}`}
              className="group rounded-xl border border-slate-800/80 bg-[#0E131F]/60 hover:bg-[#0E131F] hover:border-slate-700 transition-all p-6 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="w-full h-40 rounded-lg bg-[#070A10] border border-slate-800/80 p-4 mb-5 flex flex-col justify-between relative overflow-hidden group-hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="text-indigo-400">#architecture</span>
                    <span>Oct 24</span>
                  </div>
                  
                  <div className="my-auto font-mono text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded border border-slate-800 truncate">
                    <code>const store = createStore()</code>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>DevLog Edition</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                    {post.categories?.[0]?.name || 'Frontend'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {post.reading_minutes || 8} min read
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug mb-3 line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-200">
                    {post.author?.name ? post.author.name.substring(0, 2).toUpperCase() : 'AC'}
                  </div>
                  <span className="font-medium text-slate-300">
                    {post.author?.name || 'Alex Chen'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-400 group-hover:text-rose-400 transition-colors">
                    <Heart size={13} />
                    <span>{post.like_count || 128}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 py-12 px-6 bg-[#070A10]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">DevLog</span>
            <span>© 2024 DevLog. Built for the curious.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">API</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">RSS</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
