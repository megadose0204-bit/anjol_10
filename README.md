# DevFlow 블로그 (`AIMaster_dev` 통합 DB 사용)

DevFlow는 `AIMaster_dev` 프로젝트 가이드에 따라 개발된 블로그 프로그램입니다.
통합 Supabase 데이터베이스(`AIMaster_dev`) 환경에서 `blog_` 접두사가 부여된 데이터베이스 개체를 공유하여 동작합니다.

## 실행 방법 (Getting Started)

1. **환경 변수 구성**: `.env.local` 파일에 Supabase `AIMaster_dev` 프로젝트의 URL과 Key 입력
2. **개발 서버 실행**:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속하여 확인합니다.

3. **데이터베이스 가이드**: 자세한 마이그레이션과 스키마 정보는 [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)를 참고하세요.
