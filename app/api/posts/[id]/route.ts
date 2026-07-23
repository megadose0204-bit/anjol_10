import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postId = Number(id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: '유효하지 않은 게시글 ID입니다.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        excerpt,
        content,
        reading_minutes,
        published_at,
        created_at,
        blog_authors (
          id,
          name,
          role,
          avatar_url
        ),
        blog_post_categories (
          blog_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('id', postId)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: post })
  } catch (err: any) {
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', message: err?.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postId = Number(id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: '유효하지 않은 게시글 ID입니다.' }, { status: 400 })
    }

    const body = await request.json()
    const { title, excerpt, content } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '제목을 입력해 주세요.' }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '본문 내용을 입력해 주세요.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: updatedPost, error } = await supabase
      .from('blog_posts')
      .update({
        title: title.trim(),
        excerpt: excerpt ? excerpt.trim() : null,
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select('id, title, excerpt, updated_at')
      .single()

    if (error || !updatedPost) {
      console.error('[Post Edit API Error]:', error)
      return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.', details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 수정되었습니다.',
      data: updatedPost,
    })
  } catch (err: any) {
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', message: err?.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postId = Number(id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: '유효하지 않은 게시글 ID입니다.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. 연관 카테고리 매핑 삭제
    await supabase.from('blog_post_categories').delete().eq('post_id', postId)

    // 2. 게시글 본체 삭제
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId)

    if (error) {
      console.error('[Post Delete API Error]:', error)
      return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.', details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 삭제되었습니다.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', message: err?.message }, { status: 500 })
  }
}
