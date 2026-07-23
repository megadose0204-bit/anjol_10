# DevFlow 블로그 — 진행 상황 요약

> 이 문서는 Antigravity Agent가 모델 쿼터 소진으로 중단한 작업을 Claude Code가 이어받아
> 진행한 내용을 정리한 기록입니다. 최신 갱신일: 2026-07-21.

## 1. 시작 시점 상태

Antigravity Agent가 다음을 이미 구현해둔 상태였습니다.

- 홈페이지(`app/page.tsx`, `app/globals.css`) — DevFlow 로고, 검색창, 카테고리 메뉴,
  로그인/회원가입 버튼, Hero, 카테고리 필터, 블로그 카드 그리드, 페이지네이션, Footer
- Supabase 이메일 로그인/회원가입/로그아웃 (`app/auth/*`, Server Actions)
- Supabase 클라이언트 유틸 (`utils/supabase/{client,server,middleware}.ts`), `proxy.ts`
  (Next.js 16에서 `middleware.ts` → `proxy.ts`로 명칭이 바뀐 것을 이미 반영)
- `supabase/migration.sql`, `supabase/seed.sql` (categories/authors/posts/post_categories,
  RLS 정책, 시드 데이터)

## 2. Claude Code가 이어서 진행한 작업

### 2.1 초기 점검
- `npm run build` 성공 확인
- `docs/SUPABASE_SETUP.md` 작성 (Supabase 프로젝트 생성부터 마이그레이션 실행,
  로컬 실행, 빌드 검증까지의 전체 절차)

### 2.2 게시글 상세페이지 (`/posts/[id]`)
- `design/detail.png` 목업 기준으로 구현
- DB 스키마 확장: `posts`에 `content`, `reading_minutes`, `like_count` 컬럼 추가,
  `comments` 테이블 신규 추가 (RLS: 조회는 누구나, 작성/삭제는 작성자 본인만)
- 18개 시드 게시글 전체에 실제 본문(HTML: 소제목/인용구/코드블록/체크리스트) 채움
- 헤더, 뒤로가기, 제목/작성자/날짜/읽는 시간, 카테고리 태그, 카테고리색 기반
  그라디언트 커버, 본문 렌더링, 좋아요·댓글 카운트, 댓글 목록/작성 폼, Footer
- 홈페이지 블로그 카드를 `next/link`로 감싸 상세페이지와 연결

### 2.3 코드 품질 정리
- `npm run lint` 오류 전부 수정
  - `<a href="/">` → `next/link`의 `Link`로 교체 (auth-form, auth 페이지, 홈페이지)
  - `middleware.ts`의 미사용 변수 제거
  - React Compiler의 `set-state-in-effect` 규칙 대응 (`queueMicrotask`로 데이터
    페칭 effect 감싸기) — 동작은 기존과 동일, 규칙만 만족시키는 수정
- 홈페이지 헤더에 로그인 상태 반영 (로그인 시 이메일 표시, `/auth`로 링크)

### 2.4 게시글 작성 페이지 (`/write`)
- `design/write.png` 목업 기준으로 구현, 로그인하지 않은 사용자는 접근 시
  로그인 안내 화면으로 대체
- 제목 입력, 카테고리 최대 4개 선택, 툴바(굵게/기울임/인라인 코드/링크/이미지
  삽입), 좌우 분할 에디터+실시간 미리보기, 임시 저장(localStorage), 발행
- **보안**: 사용자가 입력한 내용을 임의 HTML로 저장하지 않고, `utils/markdown.ts`의
  자체 미니 마크다운 파서(`## 제목`, `> 인용`, ` ```코드``` `, `- 목록`, `**굵게**`,
  `*기울임*`, `` `코드` ``, `[텍스트](url)`, `![alt](url)`)로 제한 — 전체 escape 후
  안전한 태그만 치환하는 방식으로 XSS 방지
- 발행 시 `authors` 테이블에서 로그인 사용자(`user_id`)로 저자를 찾거나
  새로 생성(find-or-create) 후 `posts`/`post_categories`에 insert
- DB 스키마 확장: `authors.user_id`(로그인 사용자 연결), `likes` 테이블 추가

### 2.5 더미 링크 실제 페이지 연결
- 신규 페이지: `/topics`, `/community`, `/docs`, `/changelog`, `/privacy`
  (공용 레이아웃 `app/_components/info-page.tsx` 사용)
- 홈페이지·상세페이지 헤더의 "주제/커뮤니티", Footer의 "문서/변경 내역/개인정보
  처리방침", 로그인 폼의 "개인정보 처리방침" 링크를 모두 실제 경로로 연결

### 2.6 댓글 삭제 UI
- 상세페이지 댓글 목록에서 본인이 작성한 댓글에만 "삭제" 버튼 노출
- 낙관적 업데이트(즉시 UI 반영) 후 실패 시 롤백

### 2.7 좋아요 인터랙션
- `likes` 테이블(`post_id`, `user_id` 복합 PK) 기반 토글 기능
- 로그인 사용자는 하트 버튼으로 좋아요/취소 가능, 비로그인 사용자는 클릭 시
  로그인 페이지로 유도
- 카운트는 `likes` 테이블의 실제 행 수를 표시 (`posts.like_count`는 시드용
  정적값으로 실제 기능과는 별개)

### 2.8 Supabase 실제 반영 (사용자 승인 하에 진행)
- Supabase MCP로 실제 프로젝트(`blog`, `.env.local`과 URL 일치 확인)에 연결
- `supabase/migration.sql` 전체를 `apply_migration`으로 실행
  → `categories`, `authors`, `posts`, `post_categories`, `comments`, `likes`
  6개 테이블 생성, RLS 전부 활성화 확인
- `supabase/seed.sql` 전체를 `execute_sql`로 실행
  → 카테고리 12개, 저자 6명, 게시글 18개, 게시글-카테고리 매핑 28개,
  본문 콘텐츠 UPDATE 전체 반영 (누락 0건 확인)
- anon 키로 REST API를 직접 호출해 프론트엔드가 실제로 보게 될 데이터가
  정상 조회됨을 검증
- 로컬 dev 서버 + 헤드리스 브라우저로 홈페이지/상세페이지/작성 페이지/로그인
  페이지 스크린샷 확인 — 콘솔 에러 없음, 실제 Supabase 데이터 정상 렌더링

## 3. 최종 파일 구조 (주요 변경분)

```
app/
  page.tsx                 # 홈페이지 (로그인 상태 헤더 반영, 카드 → 상세 링크)
  layout.tsx
  globals.css               # post-cover, post-content, toolbar-btn 등 스타일 추가
  auth/
    actions.ts
    auth-form.tsx           # Link 적용, 개인정보처리방침 링크 연결
    page.tsx
    confirm/route.ts
  posts/[id]/page.tsx        # 신규: 게시글 상세페이지
  write/page.tsx              # 신규: 게시글 작성페이지
  topics/page.tsx              # 신규: 안내 페이지
  community/page.tsx            # 신규: 안내 페이지
  docs/page.tsx                   # 신규: 안내 페이지
  changelog/page.tsx                # 신규: 안내 페이지
  privacy/page.tsx                    # 신규: 안내 페이지
  _components/info-page.tsx             # 신규: 안내 페이지 공용 레이아웃
utils/
  supabase/{client,server,middleware}.ts
  markdown.ts                # 신규: 안전한 미니 마크다운 파서
supabase/
  migration.sql              # posts 확장 컬럼 + comments/likes 테이블 + authors.user_id 추가
  seed.sql                   # 게시글 본문 콘텐츠 UPDATE 추가
docs/
  SUPABASE_SETUP.md          # Supabase 설정/실행 가이드
  PROGRESS_SUMMARY.md        # 본 문서
proxy.ts
```

## 4. 알려진 제한사항 / 다음 단계 후보

- 보안 어드바이저 WARN: `categories`/`authors`/`posts`/`post_categories`의
  INSERT/UPDATE/DELETE 정책이 `USING (true)`라 로그인만 하면 누구나 무제한
  관리 가능 (원래 Antigravity Agent의 설계를 그대로 유지). 운영 환경에서는
  관리자 role 체크로 좁히는 것을 권장.
- Supabase Auth의 "Leaked Password Protection"이 비활성화 상태 (대시보드에서
  직접 켜야 함, 코드와 무관).
- 헤더의 "주제"/"커뮤니티" 페이지는 실제 콘텐츠 없이 안내 문구만 표시하는
  자리표시자(placeholder) 상태.
- 좋아요/댓글 실시간 반영은 폴링이나 Realtime 구독 없이 수동 새로고침 기반.

## 5. 실행 방법 요약

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

Supabase 프로젝트 생성/설정/마이그레이션 실행 상세 절차는
[`docs/SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) 참고.
