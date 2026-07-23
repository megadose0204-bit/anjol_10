-- ============================================================
-- DevFlow 블로그 시드 데이터
-- migration.sql 실행 후 이 파일을 실행하세요.
-- ============================================================

-- 카테고리
INSERT INTO blog_categories (name, slug) VALUES
  ('React', 'react'),
  ('아키텍처', 'architecture'),
  ('Rust', 'rust'),
  ('DevOps', 'devops'),
  ('Kubernetes', 'kubernetes'),
  ('TypeScript', 'typescript'),
  ('성능', 'performance'),
  ('JavaScript', 'javascript'),
  ('Go', 'go'),
  ('Docker', 'docker'),
  ('데이터베이스', 'database'),
  ('보안', 'security');

-- 작성자
INSERT INTO blog_authors (name, role, avatar_url) VALUES
  ('Sarah Chen', '프론트엔드 엔지니어', NULL),
  ('Alex Mercer', '시스템 개발자', NULL),
  ('J. Doe', 'DevOps 엔지니어', NULL),
  ('Elena L.', '웹 개발자', NULL),
  ('Min Park', '백엔드 개발자', NULL),
  ('Yuki Tanaka', '풀스택 개발자', NULL);

-- 게시글  (published_at 을 최근 날짜로 설정)
INSERT INTO blog_posts (title, excerpt, published_at, author_id) VALUES
  (
    'React 18의 동시성 렌더링 이해하기',
    '동시성 렌더링이 전환과 서스펜스에 초점을 맞추어 React 애플리케이션을 구축하는 방식을 어떻게 바꾸는지에 대한 심층 분석입니다.',
    CURRENT_DATE - INTERVAL '2 days',
    1
  ),
  (
    'Rust로 두려움 없는 동시성',
    'Rust의 소유권 모델이 컴파일 시점에 데이터 경합을 방지하여 골칫거리 없이 고도로 동시적인 코드를 작성할 수 있게 해주는 방법.',
    CURRENT_DATE - INTERVAL '90 days',
    2
  ),
  (
    'K8s에서의 제로 다운타임 배포',
    'Kubernetes 환경에서 복잡한 롤링 업데이트 중에도 애플리케이션을 계속 사용할 수 있도록 보장하는 전략.',
    CURRENT_DATE - INTERVAL '95 days',
    3
  ),
  (
    '고급 제네릭 패턴',
    'TypeScript 컴파일러의 한계를 뛰어넘어 복잡한 라이브러리를 위한 강력하고 타입 안전한 API를 만듭니다.',
    CURRENT_DATE - INTERVAL '100 days',
    4
  ),
  (
    'Next.js 서버 컴포넌트 완벽 가이드',
    '서버 컴포넌트의 작동 원리와 클라이언트 컴포넌트와의 차이점을 실용적인 예시와 함께 알아봅니다.',
    CURRENT_DATE - INTERVAL '5 days',
    1
  ),
  (
    'Docker Compose로 개발 환경 구축하기',
    '복잡한 마이크로서비스 아키텍처를 Docker Compose로 로컬 개발 환경에서 손쉽게 관리하는 방법을 알아봅니다.',
    CURRENT_DATE - INTERVAL '10 days',
    3
  ),
  (
    'Go 언어로 고성능 REST API 구현',
    'Go의 고루틴과 채널을 활용하여 초당 수만 건의 요청을 처리할 수 있는 REST API 서버를 구축합니다.',
    CURRENT_DATE - INTERVAL '15 days',
    5
  ),
  (
    'PostgreSQL 쿼리 최적화 실전 팁',
    '느린 쿼리를 분석하고 인덱스 전략, 쿼리 플랜 분석, 파티셔닝을 통해 데이터베이스 성능을 극대화합니다.',
    CURRENT_DATE - INTERVAL '20 days',
    5
  ),
  (
    'JavaScript 비동기 패턴 마스터하기',
    'Promise, async/await, 이벤트 루프의 내부 동작을 깊이 이해하고 효율적인 비동기 코드를 작성합니다.',
    CURRENT_DATE - INTERVAL '25 days',
    6
  ),
  (
    'React Query로 서버 상태 관리하기',
    'TanStack Query를 사용하여 복잡한 서버 상태를 캐싱, 동기화, 업데이트하는 모범 사례를 소개합니다.',
    CURRENT_DATE - INTERVAL '30 days',
    1
  ),
  (
    '웹 애플리케이션 보안 체크리스트',
    'XSS, CSRF, SQL 인젝션 등 주요 웹 보안 취약점과 이를 방어하는 실질적인 방법들을 정리합니다.',
    CURRENT_DATE - INTERVAL '35 days',
    3
  ),
  (
    'Rust로 WebAssembly 시작하기',
    'Rust를 사용하여 웹 브라우저에서 네이티브에 가까운 성능을 달성하는 WebAssembly 모듈을 작성합니다.',
    CURRENT_DATE - INTERVAL '40 days',
    2
  ),
  (
    'TypeScript 5의 새로운 기능 총정리',
    'Decorators, const type parameters, 향상된 enum 지원 등 TypeScript 5에서 추가된 주요 기능을 살펴봅니다.',
    CURRENT_DATE - INTERVAL '45 days',
    4
  ),
  (
    'Kubernetes Helm 차트 실전 가이드',
    'Helm을 사용하여 복잡한 쿠버네티스 애플리케이션의 배포를 패키징하고 관리하는 모범 사례입니다.',
    CURRENT_DATE - INTERVAL '50 days',
    3
  ),
  (
    'CSS Container Queries 완벽 정리',
    '컴포넌트 기반 반응형 디자인의 게임 체인저인 Container Queries의 사용법과 실전 패턴을 알아봅니다.',
    CURRENT_DATE - INTERVAL '55 days',
    6
  ),
  (
    'GraphQL vs REST: 2024 비교 가이드',
    '두 API 아키텍처의 장단점을 실제 프로젝트 관점에서 비교하고, 프로젝트에 맞는 선택 기준을 제시합니다.',
    CURRENT_DATE - INTERVAL '60 days',
    5
  ),
  (
    'DevOps 파이프라인 자동화 전략',
    'CI/CD 파이프라인의 설계부터 모니터링까지, 소프트웨어 딜리버리를 가속화하는 자동화 전략을 공유합니다.',
    CURRENT_DATE - INTERVAL '65 days',
    3
  ),
  (
    'React 성능 최적화 7가지 패턴',
    'React.memo, useMemo, 코드 스플리팅 등 실제 프로덕션에서 검증된 성능 최적화 기법을 설명합니다.',
    CURRENT_DATE - INTERVAL '70 days',
    1
  );

-- 게시글-카테고리 관계
-- 1: React 18의 동시성 렌더링 이해하기 → React, 아키텍처
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'React 18의 동시성 렌더링 이해하기' AND c.slug = 'react';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'React 18의 동시성 렌더링 이해하기' AND c.slug = 'architecture';

-- 2: Rust로 두려움 없는 동시성 → Rust, 성능
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Rust로 두려움 없는 동시성' AND c.slug = 'rust';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Rust로 두려움 없는 동시성' AND c.slug = 'performance';

-- 3: K8s에서의 제로 다운타임 배포 → DevOps, Kubernetes
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'K8s에서의 제로 다운타임 배포' AND c.slug = 'devops';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'K8s에서의 제로 다운타임 배포' AND c.slug = 'kubernetes';

-- 4: 고급 제네릭 패턴 → TypeScript
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = '고급 제네릭 패턴' AND c.slug = 'typescript';

-- 5: Next.js 서버 컴포넌트 완벽 가이드 → React, 아키텍처
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Next.js 서버 컴포넌트 완벽 가이드' AND c.slug = 'react';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Next.js 서버 컴포넌트 완벽 가이드' AND c.slug = 'architecture';

-- 6: Docker Compose로 개발 환경 구축하기 → DevOps, Docker
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Docker Compose로 개발 환경 구축하기' AND c.slug = 'devops';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Docker Compose로 개발 환경 구축하기' AND c.slug = 'docker';

-- 7: Go 언어로 고성능 REST API 구현 → Go, 성능
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Go 언어로 고성능 REST API 구현' AND c.slug = 'go';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Go 언어로 고성능 REST API 구현' AND c.slug = 'performance';

-- 8: PostgreSQL 쿼리 최적화 실전 팁 → 데이터베이스, 성능
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'PostgreSQL 쿼리 최적화 실전 팁' AND c.slug = 'database';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'PostgreSQL 쿼리 최적화 실전 팁' AND c.slug = 'performance';

-- 9: JavaScript 비동기 패턴 마스터하기 → JavaScript
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'JavaScript 비동기 패턴 마스터하기' AND c.slug = 'javascript';

-- 10: React Query로 서버 상태 관리하기 → React
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'React Query로 서버 상태 관리하기' AND c.slug = 'react';

-- 11: 웹 애플리케이션 보안 체크리스트 → 보안
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = '웹 애플리케이션 보안 체크리스트' AND c.slug = 'security';

-- 12: Rust로 WebAssembly 시작하기 → Rust, 성능
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Rust로 WebAssembly 시작하기' AND c.slug = 'rust';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Rust로 WebAssembly 시작하기' AND c.slug = 'performance';

-- 13: TypeScript 5의 새로운 기능 총정리 → TypeScript
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'TypeScript 5의 새로운 기능 총정리' AND c.slug = 'typescript';

-- 14: Kubernetes Helm 차트 실전 가이드 → Kubernetes, DevOps
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Kubernetes Helm 차트 실전 가이드' AND c.slug = 'kubernetes';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Kubernetes Helm 차트 실전 가이드' AND c.slug = 'devops';

-- 15: CSS Container Queries 완벽 정리 → JavaScript
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'CSS Container Queries 완벽 정리' AND c.slug = 'javascript';

-- 16: GraphQL vs REST: 2024 비교 가이드 → 아키텍처
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'GraphQL vs REST: 2024 비교 가이드' AND c.slug = 'architecture';

-- 17: DevOps 파이프라인 자동화 전략 → DevOps
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'DevOps 파이프라인 자동화 전략' AND c.slug = 'devops';

-- 18: React 성능 최적화 7가지 패턴 → React, 성능
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'React 성능 최적화 7가지 패턴' AND c.slug = 'react';
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'React 성능 최적화 7가지 패턴' AND c.slug = 'performance';

-- ============================================================
-- 게시글 상세페이지 본문 콘텐츠 (content / reading_minutes / like_count)
-- migration.sql의 posts 확장 컬럼(content, reading_minutes, like_count)을
-- 반영한 UPDATE 문입니다. 위 INSERT 구문 실행 후에 실행하세요.
-- ============================================================

UPDATE blog_posts SET reading_minutes = 8, like_count = 1247, content = $$
<p>React 18의 동시성 렌더링(Concurrent Rendering)은 React가 애플리케이션을 빌드하는 방식에 있어 패러다임의 전환을 의미합니다. 렌더링 작업을 중단하고, 우선순위를 조정하고, 필요하다면 폐기할 수 있게 되면서 사용자 인터페이스는 대규모 업데이트 중에도 항상 반응성을 유지할 수 있습니다.</p>
<h2>클라이언트 사이드 렌더링의 문제점</h2>
<p>역사적으로 React 애플리케이션은 주로 클라이언트 사이드 렌더링(CSR)을 사용하거나 초기 페이지 로드에서 서버 사이드 렌더링(SSR)을 사용해 왔습니다. 하지만 SSR을 사용하더라도 클라이언트에서 애플리케이션을 하이드레이션하기 위해 여전히 많은 양의 JavaScript가 필요했습니다.</p>
<blockquote>서버 컴포넌트를 사용하면 서버에서 렌더링되고 선택적으로 캐시될 수 있는 UI를 작성할 수 있습니다. Next.js에서는 라우트 세그먼트별로 렌더링 작업이 추가로 분할되어 스트리밍과 부분 렌더링을 가능하게 합니다. — React 공식 문서</blockquote>
<h2>구현 예시</h2>
<p>useTransition과 useDeferredValue 훅을 사용하면 긴급하지 않은 업데이트를 낮은 우선순위로 처리하여 입력 지연 없이 부드러운 UI를 유지할 수 있습니다.</p>
<pre><code>const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() =&gt; {
    setTab(nextTab);
  });
}</code></pre>
<h2>주요 이점</h2>
<ul>
  <li>✅ 번들 크기 영향 없음: 서버 컴포넌트에서만 사용되는 코드는 클라이언트로 전송되지 않습니다.</li>
  <li>✅ 반응성 유지: 긴급하지 않은 렌더링 작업이 사용자 입력을 차단하지 않습니다.</li>
  <li>✅ 자동 코드 스플리팅: Next.js는 라우트 세그먼트와 컴포넌트 경계를 기반으로 코드를 자동으로 분할합니다.</li>
</ul>
$$
WHERE title = 'React 18의 동시성 렌더링 이해하기';

UPDATE blog_posts SET reading_minutes = 10, like_count = 892, content = $$
<p>Rust의 소유권(ownership) 모델은 가비지 컬렉터 없이도 메모리 안전성을 보장하는 독특한 접근 방식입니다. 컴파일 시점에 데이터 경합(data race)을 방지함으로써, 런타임 오버헤드 없이 고도로 동시적인 코드를 작성할 수 있게 해줍니다.</p>
<h2>소유권과 대여</h2>
<p>모든 값은 하나의 소유자만 가질 수 있으며, 소유권은 이동(move)되거나 대여(borrow)될 수 있습니다. 컴파일러는 이 규칙을 엄격하게 검사하여 use-after-free나 이중 해제 같은 버그를 원천 차단합니다.</p>
<pre><code>fn main() {
    let data = vec![1, 2, 3];
    let handle = std::thread::spawn(move || {
        println!("{:?}", data);
    });
    handle.join().unwrap();
}</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ 컴파일 시점 데이터 경합 방지</li>
  <li>✅ 런타임 오버헤드 없는 메모리 안전성</li>
  <li>✅ Send/Sync 트레이트로 스레드 안전성을 타입 시스템에 반영</li>
</ul>
$$
WHERE title = 'Rust로 두려움 없는 동시성';

UPDATE blog_posts SET reading_minutes = 7, like_count = 654, content = $$
<p>Kubernetes 환경에서 애플리케이션을 계속 사용할 수 있도록 보장하면서 복잡한 롤링 업데이트를 수행하는 것은 프로덕션 운영의 핵심 과제입니다.</p>
<h2>롤링 업데이트 전략</h2>
<p>readinessProbe와 livenessProbe를 적절히 설정하고, maxSurge와 maxUnavailable 값을 조정하면 트래픽을 끊김 없이 새 파드로 전환할 수 있습니다.</p>
<blockquote>배포는 코드가 아니라 사용자 경험을 배포하는 과정입니다. 다운타임 없는 배포는 신뢰의 문제입니다.</blockquote>
<h2>체크리스트</h2>
<ul>
  <li>✅ readiness/liveness probe 설정</li>
  <li>✅ PodDisruptionBudget으로 동시 중단 파드 수 제한</li>
  <li>✅ preStop hook으로 연결 드레이닝 처리</li>
</ul>
$$
WHERE title = 'K8s에서의 제로 다운타임 배포';

UPDATE blog_posts SET reading_minutes = 9, like_count = 431, content = $$
<p>TypeScript 컴파일러의 한계를 뛰어넘어 복잡한 라이브러리를 위한 강력하고 타입 안전한 API를 만드는 방법을 살펴봅니다.</p>
<h2>조건부 타입과 매핑된 타입</h2>
<p>제네릭과 조건부 타입(conditional types)을 조합하면 입력 타입에 따라 반환 타입이 달라지는 함수를 정확하게 표현할 수 있습니다.</p>
<pre><code>type Unwrap&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : T;

async function fetchData&lt;T&gt;(url: string): Promise&lt;Unwrap&lt;T&gt;&gt; {
  const res = await fetch(url);
  return res.json();
}</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ infer 키워드로 타입 추론</li>
  <li>✅ 매핑된 타입으로 일관된 변환 규칙 적용</li>
  <li>✅ 타입 가드로 런타임 안전성 확보</li>
</ul>
$$
WHERE title = '고급 제네릭 패턴';

UPDATE blog_posts SET reading_minutes = 8, like_count = 1023, content = $$
<p>서버 컴포넌트의 작동 원리와 클라이언트 컴포넌트와의 차이점을 실용적인 예시와 함께 알아봅니다.</p>
<h2>서버 컴포넌트란</h2>
<p>서버 컴포넌트는 기본적으로 서버에서만 렌더링되며, 브라우저로 전송되는 JavaScript 번들에 포함되지 않습니다. 데이터베이스나 내부 API에 직접 접근할 수 있어 별도의 API 레이어 없이도 안전하게 데이터를 가져올 수 있습니다.</p>
<pre><code>export default async function Page() {
  const posts = await db.query('select * from posts');
  return &lt;PostList posts={posts} /&gt;;
}</code></pre>
<h2>언제 클라이언트 컴포넌트를 써야 할까</h2>
<ul>
  <li>✅ onClick 같은 이벤트 핸들러가 필요할 때</li>
  <li>✅ useState, useEffect 등 훅을 사용할 때</li>
  <li>✅ 브라우저 전용 API(localStorage 등)에 접근할 때</li>
</ul>
$$
WHERE title = 'Next.js 서버 컴포넌트 완벽 가이드';

UPDATE blog_posts SET reading_minutes = 6, like_count = 512, content = $$
<p>복잡한 마이크로서비스 아키텍처를 Docker Compose로 로컬 개발 환경에서 손쉽게 관리하는 방법을 알아봅니다.</p>
<h2>서비스 정의</h2>
<pre><code>services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: devflow</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ depends_on으로 서비스 시작 순서 제어</li>
  <li>✅ 볼륨 마운트로 코드 변경 즉시 반영</li>
  <li>✅ 네트워크 분리로 서비스 간 격리</li>
</ul>
$$
WHERE title = 'Docker Compose로 개발 환경 구축하기';

UPDATE blog_posts SET reading_minutes = 9, like_count = 378, content = $$
<p>Go의 고루틴과 채널을 활용하여 초당 수만 건의 요청을 처리할 수 있는 REST API 서버를 구축하는 방법을 소개합니다.</p>
<h2>동시성 모델</h2>
<p>고루틴은 OS 스레드보다 훨씬 가벼운 경량 스레드로, 수만 개를 동시에 실행해도 메모리 오버헤드가 크지 않습니다. 채널을 통해 고루틴 간 안전하게 데이터를 주고받을 수 있습니다.</p>
<pre><code>func handler(w http.ResponseWriter, r *http.Request) {
    result := make(chan string)
    go fetchData(result)
    w.Write([]byte(&lt;-result))
}</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ 고루틴으로 경량 동시성 확보</li>
  <li>✅ sync.Pool로 메모리 할당 최소화</li>
  <li>✅ context로 요청 타임아웃 관리</li>
</ul>
$$
WHERE title = 'Go 언어로 고성능 REST API 구현';

UPDATE blog_posts SET reading_minutes = 11, like_count = 745, content = $$
<p>느린 쿼리를 분석하고 인덱스 전략, 쿼리 플랜 분석, 파티셔닝을 통해 데이터베이스 성능을 극대화하는 실전 팁을 정리합니다.</p>
<h2>EXPLAIN ANALYZE로 병목 찾기</h2>
<pre><code>EXPLAIN ANALYZE
SELECT * FROM posts
WHERE published_at &gt; now() - interval '7 days'
ORDER BY published_at DESC;</code></pre>
<blockquote>인덱스는 공짜가 아닙니다. 쓰기 성능과 읽기 성능 사이의 트레이드오프를 항상 고려해야 합니다.</blockquote>
<h2>체크리스트</h2>
<ul>
  <li>✅ 자주 필터링/정렬하는 컬럼에 인덱스 생성</li>
  <li>✅ N+1 쿼리를 조인이나 배치 쿼리로 대체</li>
  <li>✅ 대용량 테이블은 파티셔닝 고려</li>
</ul>
$$
WHERE title = 'PostgreSQL 쿼리 최적화 실전 팁';

UPDATE blog_posts SET reading_minutes = 10, like_count = 601, content = $$
<p>Promise, async/await, 이벤트 루프의 내부 동작을 깊이 이해하고 효율적인 비동기 코드를 작성하는 방법을 다룹니다.</p>
<h2>이벤트 루프와 마이크로태스크</h2>
<p>Promise의 콜백은 마이크로태스크 큐에 들어가며, 매크로태스크(setTimeout 등)보다 먼저 처리됩니다. 이 순서를 이해하면 예상치 못한 실행 순서 버그를 피할 수 있습니다.</p>
<pre><code>console.log('1');
setTimeout(() =&gt; console.log('2'), 0);
Promise.resolve().then(() =&gt; console.log('3'));
console.log('4');
// 출력 순서: 1, 4, 3, 2</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ 마이크로태스크가 매크로태스크보다 우선 처리됨</li>
  <li>✅ Promise.all로 병렬 처리, 순차 await로 의존성 처리</li>
  <li>✅ try/catch로 async 함수의 예외를 명확히 처리</li>
</ul>
$$
WHERE title = 'JavaScript 비동기 패턴 마스터하기';

UPDATE blog_posts SET reading_minutes = 8, like_count = 933, content = $$
<p>TanStack Query를 사용하여 복잡한 서버 상태를 캐싱, 동기화, 업데이트하는 모범 사례를 소개합니다.</p>
<h2>서버 상태는 클라이언트 상태와 다르다</h2>
<p>서버 상태는 내가 소유하지 않은 데이터이며, 언제든 오래될 수 있습니다. React Query는 캐싱, 재검증, 백그라운드 업데이트를 자동으로 처리해 이 문제를 해결합니다.</p>
<pre><code>const { data, isLoading } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 60_000,
});</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ staleTime으로 불필요한 재요청 제어</li>
  <li>✅ 낙관적 업데이트(optimistic update)로 즉각적인 UX 제공</li>
  <li>✅ queryKey 설계가 캐시 무효화 전략의 핵심</li>
</ul>
$$
WHERE title = 'React Query로 서버 상태 관리하기';

UPDATE blog_posts SET reading_minutes = 12, like_count = 1567, content = $$
<p>XSS, CSRF, SQL 인젝션 등 주요 웹 보안 취약점과 이를 방어하는 실질적인 방법들을 정리합니다.</p>
<h2>주요 취약점</h2>
<p>사용자 입력을 신뢰하지 않는 것이 모든 웹 보안의 출발점입니다. 서버와 클라이언트 양쪽에서 입력을 검증하고, 출력 시점에 이스케이프 처리를 해야 합니다.</p>
<blockquote>보안은 기능이 아니라 프로세스입니다. 한 번의 점검으로 끝나지 않습니다.</blockquote>
<h2>체크리스트</h2>
<ul>
  <li>✅ 모든 사용자 입력을 이스케이프 처리</li>
  <li>✅ SameSite 쿠키와 CSRF 토큰으로 CSRF 방어</li>
  <li>✅ 파라미터화된 쿼리로 SQL 인젝션 방지</li>
  <li>✅ Content-Security-Policy 헤더 설정</li>
</ul>
$$
WHERE title = '웹 애플리케이션 보안 체크리스트';

UPDATE blog_posts SET reading_minutes = 9, like_count = 288, content = $$
<p>Rust를 사용하여 웹 브라우저에서 네이티브에 가까운 성능을 달성하는 WebAssembly 모듈을 작성하는 방법을 알아봅니다.</p>
<h2>wasm-bindgen으로 JS와 연결하기</h2>
<pre><code>#[wasm_bindgen]
pub fn fibonacci(n: u32) -&gt; u32 {
    if n &lt;= 1 { return n; }
    fibonacci(n - 1) + fibonacci(n - 2)
}</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ 계산 집약적 로직을 WASM으로 오프로드</li>
  <li>✅ wasm-bindgen으로 JS와 타입 안전하게 통신</li>
  <li>✅ 번들 크기 최적화를 위해 wasm-opt 사용</li>
</ul>
$$
WHERE title = 'Rust로 WebAssembly 시작하기';

UPDATE blog_posts SET reading_minutes = 7, like_count = 456, content = $$
<p>Decorators, const type parameters, 향상된 enum 지원 등 TypeScript 5에서 추가된 주요 기능을 살펴봅니다.</p>
<h2>const 타입 매개변수</h2>
<pre><code>function first&lt;const T extends readonly unknown[]&gt;(arr: T): T[0] {
  return arr[0];
}
const result = first(['a', 'b', 'c']); // 타입: "a"</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ const 타입 매개변수로 리터럴 타입 추론 강화</li>
  <li>✅ 표준 데코레이터로 클래스 메타프로그래밍 단순화</li>
  <li>✅ satisfies 연산자로 타입 안전성과 추론을 동시에 확보</li>
</ul>
$$
WHERE title = 'TypeScript 5의 새로운 기능 총정리';

UPDATE blog_posts SET reading_minutes = 10, like_count = 502, content = $$
<p>Helm을 사용하여 복잡한 쿠버네티스 애플리케이션의 배포를 패키징하고 관리하는 모범 사례를 소개합니다.</p>
<h2>차트 구조</h2>
<p>values.yaml로 환경별 설정을 분리하고, templates 디렉토리에서 리소스를 템플릿화하면 동일한 차트로 여러 환경에 배포할 수 있습니다.</p>
<pre><code>helm upgrade --install devflow ./chart \
  -f values.production.yaml \
  --namespace devflow</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ values.yaml로 환경별 설정 분리</li>
  <li>✅ helm rollback으로 즉시 이전 리비전 복구</li>
  <li>✅ 서브차트로 공통 의존성 재사용</li>
</ul>
$$
WHERE title = 'Kubernetes Helm 차트 실전 가이드';

UPDATE blog_posts SET reading_minutes = 6, like_count = 334, content = $$
<p>컴포넌트 기반 반응형 디자인의 게임 체인저인 Container Queries의 사용법과 실전 패턴을 알아봅니다.</p>
<h2>사용법</h2>
<pre><code>.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { grid-template-columns: 1fr 1fr; }
}</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ 뷰포트가 아닌 부모 컨테이너 크기 기준으로 반응형 처리</li>
  <li>✅ 재사용 가능한 컴포넌트 디자인에 특히 유용</li>
</ul>
$$
WHERE title = 'CSS Container Queries 완벽 정리';

UPDATE blog_posts SET reading_minutes = 11, like_count = 812, content = $$
<p>두 API 아키텍처의 장단점을 실제 프로젝트 관점에서 비교하고, 프로젝트에 맞는 선택 기준을 제시합니다.</p>
<h2>핵심 차이점</h2>
<p>REST는 리소스 중심의 단순한 구조와 캐싱 용이성이 강점이고, GraphQL은 오버페칭/언더페칭 문제를 해결하며 클라이언트가 필요한 데이터만 정확히 요청할 수 있습니다.</p>
<blockquote>정답은 없습니다. 클라이언트 다양성과 데이터 복잡도가 선택의 기준이 되어야 합니다.</blockquote>
<h2>정리</h2>
<ul>
  <li>✅ 단순한 CRUD 위주라면 REST가 유리</li>
  <li>✅ 클라이언트별 데이터 요구가 다양하다면 GraphQL 고려</li>
</ul>
$$
WHERE title = 'GraphQL vs REST: 2024 비교 가이드';

UPDATE blog_posts SET reading_minutes = 9, like_count = 421, content = $$
<p>CI/CD 파이프라인의 설계부터 모니터링까지, 소프트웨어 딜리버리를 가속화하는 자동화 전략을 공유합니다.</p>
<h2>파이프라인 단계</h2>
<p>빌드, 테스트, 정적 분석, 스테이징 배포, 프로덕션 배포까지 각 단계를 자동화하고, 실패 시 즉시 알림을 받을 수 있도록 구성하는 것이 핵심입니다.</p>
<h2>체크리스트</h2>
<ul>
  <li>✅ 모든 커밋에 대해 자동 테스트 실행</li>
  <li>✅ 스테이징 환경에서 프로덕션과 동일한 설정 사용</li>
  <li>✅ 배포 후 자동 롤백 조건 정의</li>
</ul>
$$
WHERE title = 'DevOps 파이프라인 자동화 전략';

UPDATE blog_posts SET reading_minutes = 10, like_count = 1189, content = $$
<p>React.memo, useMemo, 코드 스플리팅 등 실제 프로덕션에서 검증된 성능 최적화 기법을 설명합니다.</p>
<h2>불필요한 리렌더링 방지</h2>
<pre><code>const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item =&gt; &lt;Item key={item.id} {...item} /&gt;);
});</code></pre>
<h2>정리</h2>
<ul>
  <li>✅ React.memo로 props가 변하지 않으면 리렌더링 생략</li>
  <li>✅ useMemo/useCallback으로 참조 안정성 확보</li>
  <li>✅ React.lazy와 Suspense로 코드 스플리팅</li>
  <li>✅ 가상화(virtualization)로 대량 리스트 렌더링 최적화</li>
</ul>
$$
WHERE title = 'React 성능 최적화 7가지 패턴';
