'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

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
  author_id: number
  author: Author | null
  categories: Category[]
}

const POSTS_PER_PAGE = 9

/* ------------------------------------------------------------------ */
/*  Helper: 날짜 포맷                                                  */
/* ------------------------------------------------------------------ */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '1일 전'
  if (diffDays < 7) return `${diffDays}일 전`

  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}월 ${day}일`
}

/* ------------------------------------------------------------------ */
/*  Helper: 아바타 이니셜                                               */
/* ------------------------------------------------------------------ */
function getInitials(name: string): string {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const supabase = useMemo(() => createClient(), [])

  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const categoriesRef = useRef<Category[]>([])
  categoriesRef.current = categories

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE))

  /* ---- Fetch categories ---- */
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [supabase])

  /* ---- Auth state ---- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  /* ---- Fetch posts ---- */
  useEffect(() => {
    let ignore = false
    async function loadPosts() {
      setLoading(true)

      const from = (currentPage - 1) * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1

      // Build post IDs filter if category selected
      let postIds: number[] | null = null
      if (activeCategory) {
        const cat = categoriesRef.current.find((c) => c.slug === activeCategory)
        if (cat) {
          const { data: pcData } = await supabase
            .from('blog_post_categories')
            .select('post_id')
            .eq('category_id', cat.id)
          postIds = pcData?.map((r) => r.post_id) ?? []
        }
      }

      // Count
      let countQuery = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
      if (postIds !== null) {
        if (postIds.length === 0) {
          if (!ignore) {
            setPosts([])
            setTotalCount(0)
            setLoading(false)
          }
          return
        }
        countQuery = countQuery.in('id', postIds)
      }
      if (searchQuery.trim()) {
        countQuery = countQuery.ilike('title', `%${searchQuery.trim()}%`)
      }
      const { count } = await countQuery
      if (ignore) return
      setTotalCount(count ?? 0)

      // Fetch posts
      let postsQuery = supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .range(from, to)
      if (postIds !== null) {
        postsQuery = postsQuery.in('id', postIds)
      }
      if (searchQuery.trim()) {
        postsQuery = postsQuery.ilike('title', `%${searchQuery.trim()}%`)
      }
      const { data: postsData } = await postsQuery
      if (ignore) return

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Fetch authors for these posts
      const authorIds = [...new Set(postsData.map((p) => p.author_id))]
      const { data: authorsData } = await supabase
        .from('blog_authors')
        .select('*')
        .in('id', authorIds)
      const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) ?? [])

      // Fetch categories for these posts
      const fetchedPostIds = postsData.map((p) => p.id)
      const { data: pcData } = await supabase
        .from('blog_post_categories')
        .select('post_id, category_id')
        .in('post_id', fetchedPostIds)

      const catIds = [...new Set(pcData?.map((pc) => pc.category_id) ?? [])]
      const { data: catsData } = await supabase
        .from('blog_categories')
        .select('*')
        .in('id', catIds.length > 0 ? catIds : [-1])
      const catsMap = new Map(catsData?.map((c) => [c.id, c]) ?? [])

      const postsWithRelations: Post[] = postsData.map((p) => {
        const postCatIds =
          pcData?.filter((pc) => pc.post_id === p.id).map((pc) => pc.category_id) ?? []
        return {
          ...p,
          author: authorsMap.get(p.author_id) ?? null,
          categories: postCatIds.map((cid) => catsMap.get(cid)).filter(Boolean) as Category[],
        }
      })

      if (!ignore) {
        setPosts(postsWithRelations)
        setLoading(false)
      }
    }

    loadPosts()
    return () => {
      ignore = true
    }
  }, [supabase, currentPage, activeCategory, searchQuery])

  /* ---- Category filter handler ---- */
  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug)
    setCurrentPage(1)
  }

  /* ---- Search handler ---- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  /* ---- Pagination ---- */
  function getPaginationNumbers(): (number | '...')[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col min-h-screen">
      {/* =================== HEADER =================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-xl font-black text-indigo-600 tracking-tight flex-shrink-0 no-underline">
            AutoBlog
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-[320px]">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="게시물 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all"
              />
            </div>
          </form>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-[var(--primary)] border-b-2 border-[var(--primary)] pb-0.5 no-underline">탐색</Link>
            <Link href="/topics" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">주제</Link>
            <Link href="/community" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">커뮤니티</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/write/ai-form"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg no-underline transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>✨ AI 글쓰기</span>
            </Link>
            {userEmail ? (
              <Link href="/auth" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors truncate max-w-[160px]">
                {userEmail}
              </Link>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">로그인</Link>
                <Link href="/auth" className="text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg no-underline transition-colors">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =================== HERO =================== */}
      <section className="py-14 text-center bg-gradient-to-b from-indigo-50/50 to-transparent">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
          주제, 키워드, 참고링크를 제시하면
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 max-w-xl mx-auto px-4 mb-6 font-medium leading-relaxed">
          자동으로 검색엔진에 최적화된 블로그를 만들어 드립니다
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/write/ai-form"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl no-underline shadow-md hover:shadow-lg transition-all"
          >
            <span>🤖 실시간 핫뉴스 검색 분석 및 AI 자동블로그 작성하기</span>
          </Link>
        </div>
      </section>

      {/* =================== MAIN CONTENT =================== */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 pb-16">
        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            className={`filter-btn ${activeCategory === null ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Blog Card Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="blog-card">
                <div className="skeleton h-5 w-20"></div>
                <div className="skeleton h-6 w-full mt-2"></div>
                <div className="skeleton h-4 w-full mt-1"></div>
                <div className="skeleton h-4 w-3/4 mt-1"></div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="skeleton w-9 h-9 rounded-full"></div>
                  <div className="skeleton h-4 w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg">게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="blog-card no-underline text-inherit">
                {/* Top: Tags + Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="category-tag"
                        data-category={cat.name}
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                    {formatDate(post.published_at)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-zinc-900 leading-snug">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 flex-1">
                  {post.excerpt}
                </p>

                {/* Author */}
                {post.author && (
                  <div className="flex items-center gap-3 mt-auto pt-2">
                    <div className="avatar-circle">
                      {getInitials(post.author.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 leading-tight">
                        {post.author.name}
                      </p>
                      <p className="text-xs text-zinc-400">{post.author.role}</p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              aria-label="이전 페이지"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            {getPaginationNumbers().map((page, idx) =>
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-10 text-center text-sm text-zinc-400">
                  …
                </span>
              ) : (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              aria-label="다음 페이지"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* =================== FOOTER =================== */}
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
