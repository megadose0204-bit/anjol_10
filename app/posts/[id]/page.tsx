'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  ArrowLeft, 
  Send, 
  Code2, 
  Check, 
  Copy,
  PenSquare,
  Sparkles,
  Search,
  User,
  Clock,
  Calendar,
  ThumbsUp
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
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
  content: string
  published_at: string
  reading_minutes: number
  like_count: number
  author_id: number
  category?: string
  tags?: string[]
  cover_image?: string
}

interface Comment {
  id: number
  post_id: number
  user_id: string
  author_name: string
  author_avatar?: string
  content: string
  created_at: string
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const supabase = createClient()

  const [post, setPost] = useState<Post | null>(null)
  const [author, setAuthor] = useState<Author | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copied, setCopied] = useState(false)

  // 샘플 태그 데이터
  const tags = useMemo(() => ['#react', '#state-management', '#javascript', '#frontend'], [])

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      try {
        const { data: postData } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single()

        if (postData) {
          setPost(postData)
          setLikeCount(postData.like_count || 128)

          if (postData.author_id) {
            const { data: authorData } = await supabase
              .from('authors')
              .select('*')
              .eq('id', postData.author_id)
              .single()
            if (authorData) setAuthor(authorData)
          }
        } else {
          // 기본 폴백 데이터 (stitch_blog.png 샘플 디자인 반영)
          setPost({
            id: Number(postId) || 1,
            title: 'Mastering State Management in Modern React Applications',
            excerpt: 'State management remains one of the most debated topics in the React ecosystem.',
            content: `State management remains one of the most debated topics in the React ecosystem. With the introduction of Context API, Hooks, and a myriad of third-party libraries, choosing the right tool can feel overwhelming. In this post, we'll dive deep into modern approaches to managing state efficiently.

## The Evolution of State

Before we jump into modern solutions, it's crucial to understand why we needed them in the first place. Prop drilling was the original sin of React development. Passing data down ten levels deep made components brittle and refactoring a nightmare.

- **Local State**: Perfect for UI toggles and form inputs.
- **Server State**: Data fetched from an API (e.g., React Query, SWR).
- **Global State**: Shared data like user sessions or themes.

Let's look at Zustand, a minimalist state management solution that has been gaining massive popularity for its simplicity and un-opinionated nature.

\`\`\`javascript
import { create } from 'zustand'

const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))

function BearCounter() {
  const bears = useStore((state) => state.bears)
  return <h1>{bears} around here ...</h1>
}
\`\`\`

Notice how we don't need a Provider wrapping our entire app? This is one of Zustand's strongest selling points. It hooks directly into the React lifecycle without bloating the component tree.

## Conclusion

Choosing a state management tool isn't about finding the "best" library; it's about finding the right tool for your specific architectural needs. Start with local state, move to Context when necessary, and bring in tools like Zustand or Redux only when the complexity demands it.`,
            published_at: '2024-10-24T00:00:00Z',
            reading_minutes: 8,
            like_count: 128,
            author_id: 1
          })

          setAuthor({
            id: 1,
            name: 'Alex Chen',
            role: 'Senior Frontend Architect',
            avatar_url: null
          })

          setComments([
            {
              id: 1,
              post_id: Number(postId),
              user_id: 'user_1',
              author_name: 'Sarah Jenkins',
              content: 'Great breakdown! I completely agree that reaching for Redux too early is a common mistake. Zustand has been a breath of fresh air for our recent projects.',
              created_at: '2 hours ago'
            },
            {
              id: 2,
              post_id: Number(postId),
              user_id: 'user_2',
              author_name: 'Mike Kim',
              content: 'Have you considered Jotai for atomic state management? It pairs really well with the concepts you discussed here, especially for highly interactive dashboards.',
              created_at: '5 hours ago'
            }
          ])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId, supabase])

  const handleLike = () => {
    if (liked) {
      setLiked(false)
      setLikeCount((prev) => prev - 1)
    } else {
      setLiked(true)
      setLikeCount((prev) => prev + 1)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    const newEntry: Comment = {
      id: Date.now(),
      post_id: Number(postId),
      user_id: 'current_user',
      author_name: 'DevLog User',
      content: newComment,
      created_at: '방금 전'
    }

    setTimeout(() => {
      setComments([newEntry, ...comments])
      setNewComment('')
      setSubmittingComment(false)
    }, 300)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#94A3B8]">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>DevLog 로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-50 bg-[#0B0F17]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">DevLog</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Explore</Link>
              <Link href="/community" className="hover:text-white transition-colors">Community</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Guide</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
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

      {/* ── Main Article Container ── */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl lg:text-[40px] font-extrabold text-white leading-tight tracking-tight mb-6">
          {post?.title}
        </h1>

        <div className="flex items-center justify-between py-4 border-b border-slate-800/80 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-sm shadow-inner">
              {author?.name ? author.name.substring(0, 2).toUpperCase() : 'AC'}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition-colors cursor-pointer">
                {author?.name || 'Alex Chen'}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Oct 24, 2024</span>
                <span>•</span>
                <span>{post?.reading_minutes || 8} min read</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <button 
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-2 rounded-lg border transition-all ${
                bookmarked 
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' 
                  : 'border-slate-800 hover:border-slate-700 hover:text-white bg-slate-900/50'
              }`}
              title="Bookmark"
            >
              <Bookmark size={18} className={bookmarked ? 'fill-indigo-400' : ''} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 hover:text-white bg-slate-900/50 transition-all relative"
              title="Share Link"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
            </button>
          </div>
        </div>

        {/* ── Featured Cover Image / Diagram Container ── */}
        <div className="w-full aspect-[16/9] rounded-xl border border-slate-800 bg-[#070A10] p-6 flex flex-col justify-between overflow-hidden shadow-2xl relative mb-10 group">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>DevLog / Architecture / State Performance</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Dashboard</span>
              <span>Articles</span>
              <span>Settings</span>
            </div>
          </div>

          <div className="relative my-6 h-48 w-full flex items-center justify-center">
            <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent opacity-60" />
            
            <div className="relative z-10 text-center space-y-2">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm">
                Post: Optimizing React Re-renders (Data Flow Analysis)
              </div>
              <div className="w-64 h-32 mx-auto rounded-lg border border-slate-700/60 bg-slate-900/80 p-3 text-left font-mono text-[11px] text-slate-300 space-y-1.5 shadow-xl">
                <div className="text-indigo-400 font-bold">┌─ RootAppProvider</div>
                <div className="pl-4 text-emerald-400">├─ HeaderComponent</div>
                <div className="pl-4 text-amber-400">├─ ZustandStore (Global)</div>
                <div className="pl-8 text-slate-400">└─ UserCard (Subscribed)</div>
                <div className="text-slate-500 pt-1 text-[10px]">✔ Re-renders minimized: 94.2% efficiency</div>
              </div>
            </div>
          </div>

          <div className="text-center text-xs font-mono text-slate-500">
            Interactive State Flow Graph
          </div>
        </div>

        {/* ── Article Content Body ── */}
        <article className="prose prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6 prose-headings:text-white prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-800/60 prose-h2:pb-2 prose-code:text-indigo-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-ul:my-4 prose-li:my-1 text-base">
          <p className="text-lg text-slate-300 font-normal leading-relaxed mb-8">
            State management remains one of the most debated topics in the React ecosystem. With the introduction of Context API, Hooks, and a myriad of third-party libraries, choosing the right tool can feel overwhelming. In this post, we'll dive deep into modern approaches to managing state efficiently.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 border-b border-slate-800/60 pb-2">
            The Evolution of State
          </h2>

          <p>
            Before we jump into modern solutions, it's crucial to understand why we needed them in the first place. Prop drilling was the original sin of React development. Passing data down ten levels deep made components brittle and refactoring a nightmare.
          </p>

          <ul className="list-disc list-inside space-y-2 text-slate-300 my-6 pl-2">
            <li><strong className="text-white">Local State:</strong> Perfect for UI toggles and form inputs.</li>
            <li><strong className="text-white">Server State:</strong> Data fetched from an API (e.g., React Query, SWR).</li>
            <li><strong className="text-white">Global State:</strong> Shared data like user sessions or themes.</li>
          </ul>

          <p>
            Let's look at Zustand, a minimalist state management solution that has been gaining massive popularity for its simplicity and un-opinionated nature.
          </p>

          <div className="my-8 rounded-xl border border-slate-800 bg-[#080C14] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-slate-400">useStore.js</span>
              </span>
              <button 
                onClick={handleShare}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy size={12} />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-5 font-mono text-sm leading-relaxed text-slate-200 overflow-x-auto bg-[#080C14] m-0">
<code>{`import { create } from 'zustand'

const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))

function BearCounter() {
  const bears = useStore((state) => state.bears)
  return <h1>{bears} around here ...</h1>
}`}</code>
            </pre>
          </div>

          <p>
            Notice how we don't need a Provider wrapping our entire app? This is one of Zustand's strongest selling points. It hooks directly into the React lifecycle without bloating the component tree.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 border-b border-slate-800/60 pb-2">
            Conclusion
          </h2>

          <p>
            Choosing a state management tool isn't about finding the "best" library; it's about finding the right tool for your specific architectural needs. Start with local state, move to Context when necessary, and bring in tools like Zustand or Redux only when the complexity demands it.
          </p>

          <div className="flex flex-wrap gap-2 pt-6 mt-10 border-t border-slate-800/60">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="px-3 py-1 rounded-md text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </article>

        {/* ── Interactive Action Bar ── */}
        <div className="flex items-center justify-between py-6 my-10 border-y border-slate-800/80 text-sm font-medium text-slate-300">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                liked 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                  : 'border-slate-800 hover:border-slate-700 hover:text-white bg-slate-900/40'
              }`}
            >
              <Heart size={18} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300">
              <MessageSquare size={18} />
              <span>{comments.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <button onClick={handleShare} className="hover:text-white p-2 transition-colors">
              <Share2 size={18} />
            </button>
            <button className="hover:text-white p-2 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* ── Comments Section ── */}
        <section className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6">
            Comments ({comments.length})
          </h3>

          <form onSubmit={handleAddComment} className="mb-10">
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add to the discussion..."
                  className="w-full rounded-xl bg-[#080C14] border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>Submit</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 items-start p-4 rounded-xl border border-slate-800/60 bg-slate-900/30">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                  {comment.author_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">
                      {comment.author_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {comment.created_at}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    {comment.content}
                  </p>
                  <button className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-24 border-t border-slate-800/80 py-12 px-6 bg-[#070A10]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-mono">
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
