import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { collect24HourNews } from '@/utils/news/collector'
import { generateSeoPost, AutoPostOptions } from '@/utils/news/generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 단일 topic 또는 세부 options 객체 수신 지원
    const options: AutoPostOptions = {
      topic: body.topic || body.keyword || body.query || '',
      tone: body.tone,
      targetAudience: body.targetAudience,
      wordCount: body.wordCount ? Number(body.wordCount) : undefined,
      keywords: Array.isArray(body.keywords) ? body.keywords : body.keywords ? [body.keywords] : undefined,
      referenceUrls: Array.isArray(body.referenceUrls) ? body.referenceUrls : body.referenceUrl ? [body.referenceUrl] : undefined,
      customInstructions: body.customInstructions,
      nanoBananaApiKey: body.nanoBananaApiKey || body.apiKey,
      imageModel: body.imageModel || body.nanoBananaModel || 'nanobanana-2-2k',
      cta: body.cta && (body.cta.text || body.cta.url) ? { text: body.cta.text || '자세히 보기', url: body.cta.url || '#' } : undefined,
    }

    if (!options.topic || typeof options.topic !== 'string' || !options.topic.trim()) {
      return NextResponse.json(
        { error: '블로그 주제를 입력해 주세요.' },
        { status: 400 }
      )
    }

    console.log(`[AutoPost API] Generating post for topic: "${options.topic.trim()}" (Tone: ${options.tone || '기본'})`)

    // 1. 최근 24시간 뉴스 수집 및 4대 신호 분석
    const newsData = await collect24HourNews(options.topic.trim())

    // 2. 벤치마킹 옵션 반영 SEO 최적화 포스트 생성
    const postData = await generateSeoPost(newsData, options)

    // 3. Supabase DB 연동 및 저장 (Admin Client)
    const supabase = createAdminClient()

    // 3.1 저자 ID 확보 (1번 시드 저자 또는 AI Auto Reporter)
    const { data: authors } = await supabase.from('blog_authors').select('id').limit(1)
    let authorId: number = authors && authors.length > 0 ? authors[0].id : 1

    // 3.2 카테고리 ID 가져오기
    const { data: categoryData } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', postData.categorySlug)
      .maybeSingle()

    let categoryId = categoryData?.id

    if (!categoryId) {
      const { data: firstCategory } = await supabase.from('blog_categories').select('id').limit(1).single()
      categoryId = firstCategory?.id ?? 1
    }

    // 3.3 blog_posts 테이블에 등록 (PostgreSQL DEFAULT IDENTITY 시퀀스 사용)
    const { data: createdPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: postData.title,
        excerpt: postData.excerpt,
        content: postData.contentHtml,
        author_id: authorId,
        reading_minutes: postData.readingMinutes,
        like_count: 0,
      })
      .select('id, title, published_at')
      .single()

    if (postError || !createdPost) {
      console.error('[AutoPost API] DB insert error:', postError)
      return NextResponse.json(
        {
          error: `게시글 DB 저장 오류: ${postError?.message || '알 수 없는 오류'}. Supabase 대시보드에서 RLS 해제(ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;)가 필요할 수 있습니다.`,
          details: postError,
        },
        { status: 500 }
      )
    }

    // 3.4 blog_post_categories 매핑 등록
    if (categoryId) {
      await supabase.from('blog_post_categories').insert({
        post_id: createdPost.id,
        category_id: categoryId,
      })
    }

    const postUrl = `/posts/${createdPost.id}`

    console.log(`[AutoPost API] Successfully published post ID #${createdPost.id}: "${createdPost.title}"`)

    return NextResponse.json({
      success: true,
      message: '맞춤형 옵션 기반 AI 블로그 글이 성공적으로 등록되었습니다.',
      data: {
        postId: createdPost.id,
        postUrl,
        title: createdPost.title,
        excerpt: postData.excerpt,
        topic: options.topic,
        collectedNewsCount: newsData.articles.length,
        signals: newsData.signals,
        publishedAt: createdPost.published_at,
      },
    })
  } catch (error: any) {
    console.error('[AutoPost API] Internal Server Error:', error)
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.', message: error?.message },
      { status: 500 }
    )
  }
}
