'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

const SUGGESTED_TOPICS = [
  'AI 콘텐츠 자동화의 미래',
  'SaaS 성장 전략 가이드',
  '스타트업 마케팅 실전 노하우',
  '개인 브랜딩으로 커리어 성장하기',
  '원격 근무 생산성 높이는 법',
  '2026 SEO 완벽 가이드',
]

const TONE_OPTIONS = ['전문적', '친근함', '설득력있는', '격식있는', '위트있는']

export default function AiFormPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [authChecked, setAuthChecked] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // 폼 입력 상태
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('전문적')
  const [targetAudience, setTargetAudience] = useState('')
  const [wordCount, setWordCount] = useState(1000)
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [referenceUrl1, setReferenceUrl1] = useState('')
  const [referenceUrl2, setReferenceUrl2] = useState('')
  const [referenceUrl3, setReferenceUrl3] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [nanoBananaApiKey, setNanoBananaApiKey] = useState('')
  const [imageModel, setImageModel] = useState('nanobanana-2-2k')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')

  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setAuthChecked(true)
    })
  }, [supabase])

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault()
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()])
      }
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (tag: string) => {
    setKeywords(keywords.filter((k) => k !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      setErrorMsg('블로그 주제를 입력해 주세요.')
      return
    }

    setErrorMsg(null)
    setLoading(true)
    setStatusMsg('최근 24시간 실시간 트렌드 및 지표를 수집하고 맞춤형 포스트를 생성 중입니다...')

    const refUrls = [referenceUrl1, referenceUrl2, referenceUrl3].filter((u) => u.trim().length > 0)

    try {
      const res = await fetch('/api/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          targetAudience: targetAudience.trim() || undefined,
          wordCount,
          keywords: keywords.length > 0 ? keywords : undefined,
          referenceUrls: refUrls.length > 0 ? refUrls : undefined,
          customInstructions: customInstructions.trim() || undefined,
          nanoBananaApiKey: nanoBananaApiKey.trim() || undefined,
          imageModel,
          cta: ctaText.trim() ? { text: ctaText.trim(), url: ctaUrl.trim() || '#' } : undefined,
        }),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setStatusMsg(`포스팅 작성 완료! [${result.data.title}] 이동 중...`)
        setTimeout(() => {
          router.push(result.data.postUrl)
        }, 1000)
      } else {
        setErrorMsg(result.error || 'AI 글 생성에 실패했습니다.')
        setLoading(false)
        setStatusMsg(null)
      }
    } catch {
      setErrorMsg('서버와 통신 중 에러가 발생했습니다.')
      setLoading(false)
      setStatusMsg(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-indigo-600 no-underline">
            AutoBlog
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            {userEmail ? <span>{userEmail}</span> : <Link href="/auth">로그인</Link>}
          </div>
        </div>
      </header>

      {/* 메인 폼 컨테이너 */}
      <main className="flex-1 py-10 px-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          
          {/* 주제 입력 섹션 */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">어떤 주제로 글을 쓸까요?</h1>
            
            {/* 추천 주제 칩 */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                💡 이런 주제는 어때요?
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* 주제 텍스트 영역 */}
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="블로그 주제를 입력하세요 (예: AI 콘텐츠 자동화의 미래)"
              className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder-slate-400"
            />
          </div>

          {/* 세부 설정 영역 */}
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              ⚙️ 세부 설정
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 글 분위기 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">글 분위기 (Tone)</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 cursor-pointer"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 대상 독자 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">대상 독자</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="어떤 독자를 위한 글인지 입력하세요 (선택)"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            {/* 원하는 분량 (단어 수 슬라이더) */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>원하는 분량 (단어 수)</span>
                <span className="text-indigo-600 font-extrabold">{wordCount.toLocaleString()} 단어</span>
              </div>
              <input
                type="range"
                min={500}
                max={2000}
                step={100}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>500 (간결함)</span>
                <span>1,000 (표준)</span>
                <span>2,000 (상세 가이드)</span>
              </div>
            </div>

            {/* 검색 키워드 태그 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">검색 키워드 (SEO Keywords)</label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                placeholder="키워드 입력 후 Enter (선택)"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400"
              />
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {keywords.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-semibold">
                      #{tag}
                      <button type="button" onClick={() => handleRemoveKeyword(tag)} className="hover:text-indigo-900 cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 참고 링크 (최대 3개) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>참고 웹페이지 링크</span>
                <span className="text-slate-400 font-normal">최대 3개</span>
              </label>
              <input
                type="url"
                name="ref_url_1"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={referenceUrl1}
                onChange={(e) => setReferenceUrl1(e.target.value)}
                placeholder="https://example.com/reference-1"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 mb-1.5"
              />
              <input
                type="url"
                name="ref_url_2"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={referenceUrl2}
                onChange={(e) => setReferenceUrl2(e.target.value)}
                placeholder="https://example.com/reference-2"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 mb-1.5"
              />
              <input
                type="url"
                name="ref_url_3"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={referenceUrl3}
                onChange={(e) => setReferenceUrl3(e.target.value)}
                placeholder="https://example.com/reference-3"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* 추가 지시사항 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">추가 지시사항 (Custom Prompt)</label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="꼭 다뤄야 할 내용, 피해야 할 내용, 제품/서비스 언급 등 (선택)"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 resize-none"
              />
            </div>

            {/* 나노바나나 API Key 입력란 & 모델 선택 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">🎨 나노바나나 AI 이미지 모델 선택</label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 cursor-pointer font-medium"
                >
                  <option value="nanobanana">나노바나나 (Standard)</option>
                  <option value="nanobanana-2-2k">나노바나나 2 (2K High-Res - 권장)</option>
                  <option value="nanobanana-2-4k">나노바나나 2 (4K Ultra-Res)</option>
                  <option value="nanobanana-pro">나노바나나 프로 (3D Commercial)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">🔑 나노바나나 API Key (선택)</label>
                <input
                  type="password"
                  name="nanobanana_key"
                  autoComplete="new-password"
                  value={nanoBananaApiKey}
                  onChange={(e) => setNanoBananaApiKey(e.target.value)}
                  placeholder="NanoBanana / Gemini API Key"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            {/* 행동 유도 (CTA) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">행동 유도 버튼 (CTA: Call To Action)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="예: 무료로 시작하기, 자세히 알아보기"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400"
                />
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://your-site.com/signup"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

          </div>

          {/* 에러 및 상태 메시지 */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}
          {statusMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold animate-pulse">
              🚀 {statusMsg}
            </div>
          )}

          {/* 하단 글 생성 시작 버튼 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>AI 글 생성 및 분석 진행 중...</span>
                </>
              ) : (
                <span>✨ AI 글 생성 시작</span>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
