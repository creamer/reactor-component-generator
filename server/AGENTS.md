# server/AGENTS.md

## Module Context

Bun으로 실행되는 AI 프로바이더 프록시. 프론트의 `/api` 요청을 받아 Anthropic 또는 Gemini를 호출하고 정규화한 코드를 돌려준다. Vite 개발 서버가 `/api`를 3002로 프록시한다.

## Tech Stack & Constraints

- 런타임은 Bun(`Bun.serve`, `process.env`). 외부 HTTP 클라이언트 라이브러리 없이 전역 `fetch`만 쓴다 (`server/index.ts:69`, `server/index.ts:101`).
- 모델 ID는 코드에 하드코딩되어 있다 (`server/index.ts:5`, `server/index.ts:77`). 변경할 때는 해당 상수만 바꾸고 폴백 순서(앞 모델이 우선)를 유지한다.

## Implementation Patterns

- 부수효과 없는 로직은 `generator.ts`, `fallback.ts` 같은 별도 순수 모듈에 두고 `index.ts`는 라우팅과 프로바이더 호출만 맡는다. 이 파일 분리는 테스트 가능성 때문이다 (`generator.ts:1-2`).
- 라우트 응답은 항상 `CORS_HEADERS`를 함께 반환한다 (`server/index.ts:51-55`). 새 응답 경로에서 빠뜨리면 브라우저에서 CORS 오류가 난다.
- API 키 결정 순서는 클라이언트 입력, 환경변수 순이다 (`resolveApiKey`, `server/index.ts:64-66`).

## Testing Strategy

- 테스트는 서버 디렉터리에서도 vitest로 실행된다 (`vite.config.ts` test.include의 `server/**/*.test.ts`). `bun run test`로 돌린다.
- vitest(Node 계열 환경)에서 실행되므로 테스트 대상 모듈은 `Bun.*` API를 쓰지 않는다. `Bun.serve`는 `index.ts`에만 둔다.
- 테스트 이름은 한국어 문장으로 동작을 서술한다 (`server/fallback.test.ts`, `server/generator.test.ts`).

## Local Golden Rules

- `generator.ts`의 `ensureRenderCall`은 첫 번째 대문자 시작 `const|function` 선언에 `render()`를 붙이는 휴리스틱이다 (`server/generator.ts:19`). 정규식을 고치면 `generator.test.ts`의 네 가지 경우를 모두 통과시키고, 필요하면 케이스를 추가한다.
- Google 키는 URL 쿼리에 들어간다 (`server/index.ts:99`). 에러 메시지나 로그에 `url` 변수를 포함시키지 않는다. 현재 에러는 상태 코드만 담는다 (`server/index.ts:112`).
- Anthropic 경로에는 폴백과 잘림 검사가 없다 (`server/index.ts:68-96`). 추가한다면 Google 경로와 동작을 맞춘 뒤 `fallback.test.ts` 수준의 테스트를 함께 작성한다.
- `withModelFallback`은 모든 에러(429, 인증 실패 포함)에서 다음 모델로 넘어간다 (`server/fallback.ts:13-17`). 에러 종류별 분기를 넣으면 기존 테스트 `모든 모델이 실패하면 마지막 에러를 던진다`의 기대(마지막 에러 반환)를 유지한다.
