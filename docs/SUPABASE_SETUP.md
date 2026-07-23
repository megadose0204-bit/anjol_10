# Supabase 설정 및 실행 방법 (통합 DB `AIMaster_dev` 기준)

DevFlow 블로그는 통합 데이터베이스 `AIMaster_dev`의 `blog_` 접두사가 붙은 테이블들을 사용합니다.

- **인증**: 이메일/비밀번호 로그인, 회원가입, 이메일 인증, 로그아웃 (`@supabase/ssr`)
- **데이터**: `blog_categories`, `blog_authors`, `blog_posts`, `blog_post_categories`, `blog_comments`, `blog_likes`

## 1. Supabase 프로젝트 설정 (`AIMaster_dev`)

1. [supabase.com](https://supabase.com)에서 `AIMaster_dev` 통합 프로젝트를 확인/생성합니다.
2. 프로젝트 대시보드 > **Settings > API**에서 다음 값을 확인합니다.
   - `Project URL`
   - `anon` / `publishable` API key

## 2. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 아래 값을 채웁니다. (`.env.local`은 git에 커밋되지 않습니다.)

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
```

선택 사항으로, 이메일 인증 리다이렉트 URL을 배포 도메인에 맞게 지정하려면 다음도 추가합니다.

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

(로컬 개발에서는 기본값 `http://localhost:3000`이 사용됩니다.)

## 3. 이메일 인증(Auth) 설정

Supabase 대시보드 > **Authentication > URL Configuration**에서:

- **Site URL**: `http://localhost:3000` (배포 시 실제 도메인으로 변경)
- **Redirect URLs**에 `http://localhost:3000/auth/confirm` 추가 (배포 시 해당 도메인의 `/auth/confirm`도 추가)

회원가입 시 `app/auth/actions.ts`의 `signup()`이 이 경로로 인증 메일을 발송하고, `app/auth/confirm/route.ts`가 인증 코드를 세션으로 교환합니다.

## 4. 데이터베이스 마이그레이션 실행 (`AIMaster_dev` DB)

> 마이그레이션은 통합 DB `AIMaster_dev`의 SQL Editor에서 **직접** 실행하세요.

1. Supabase 대시보드 > **SQL Editor**로 이동합니다.
2. `supabase/migration.sql` 파일 내용 전체를 복사해 붙여넣고 실행(Run)합니다.
   - `blog_categories`, `blog_authors`, `blog_posts`, `blog_post_categories`, `blog_comments`, `blog_likes` 테이블 생성
   - 조회 성능을 위한 인덱스 생성 및 RLS 정책 적용
3. (선택) 테스트용 예시 데이터가 필요하면 `supabase/seed.sql` 내용을 복사해 SQL Editor에서 실행합니다.
   - `seed.sql`은 `migration.sql` 실행 **이후**에 실행해야 합니다.

## 5. 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`에서 홈페이지(카테고리 필터, 게시글 목록, 페이지네이션)를, `http://localhost:3000/auth`에서 로그인/회원가입을 확인할 수 있습니다.

## 6. 빌드 검증

```bash
npm run build
```

타입 체크와 정적/동적 라우트 생성이 정상적으로 끝나면 배포 준비가 완료된 것입니다.

## 스키마 참고 (`blog_` Prefix)

| 테이블 | 설명 |
| --- | --- |
| `blog_categories` | 게시글 카테고리 (`name`, `slug`) |
| `blog_authors` | 작성자 (`name`, `role`, `avatar_url`, `user_id`) |
| `blog_posts` | 게시글 (`title`, `excerpt`, `content`, `published_at`, `author_id`, `reading_minutes`, `like_count`) |
| `blog_post_categories` | 게시글-카테고리 다대다 매핑 (`post_id`, `category_id`) |
| `blog_comments` | 게시글 상세페이지 댓글 (`post_id`, `user_id`, `author_email`, `content`, `created_at`) |
| `blog_likes` | 게시글 좋아요 (`post_id`, `user_id`) |

전체 정의는 `supabase/migration.sql`을 참고하세요.
