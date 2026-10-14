# AGENTS.md

## Operational Commands

패키지 매니저는 bun 고정이다. npm, yarn, pnpm을 쓰지 않는다 (`bun.lock` 사용).

```bash
bun install
bun run dev        # API 서버(:3002) + Vite(:5173) 동시 실행
bun run server     # API 서버만 실행 (bun --watch)
bun run test       # vitest run (src + server 테스트 전부)
bun run test:watch
bun run lint
bun run build      # tsc -b && vite build
```

- 테스트는 반드시 `bun run test`로 실행한다. `bun test`는 Bun 내장 러너를 호출해 `vite.config.ts`의 jsdom 환경과 `src/test/setup.ts`를 무시하므로 컴포넌트 테스트가 깨진다.
- 변경 후 `bun run lint`, `bun run test`, `bun run build` 순으로 확인한다.
- 개발 서버는 사용자가 이미 띄웠을 수 있다. 포트 5173, 3002 사용 여부를 확인하고 중복 실행하지 않는다.

## Golden Rules

### Immutable

- API 키를 코드, 테스트, 로그, 커밋에 넣지 않는다. `.env`는 `.gitignore`에 있고 `.env.example`만 값 없이 커밋한다. 키 값을 응답이나 로그에 출력하지 않는다.
- `/api/config`는 키 보유 여부(boolean)만 반환한다 (`server/index.ts:147-157`). 환경변수 키 값을 클라이언트로 내리는 응답을 추가하지 않는다.
- 사용자가 UI에 입력한 키는 `useState` 메모리에만 둔다 (`src/App.tsx:18`). `localStorage` 등에 저장하지 않는다. 이 규칙은 `src/App.test.tsx`의 "입력한 API 키는 어떤 localStorage 항목에도 저장되지 않는다" 테스트가 지킨다. 그 외 상태(provider, 프롬프트 히스토리, 컴포넌트 목록)는 `usePersistentState`와 `src/utils/storage.ts`로만 저장하고, 저장 항목을 추가할 때는 키 값이 섞이지 않는지 확인한다.
- CORS가 `*`이고 (`server/index.ts:51-55`) 서버 `.env` 키로 `/api/generate`가 동작한다. 서버를 외부에 노출하는 변경을 하려면 먼저 Origin 제한이나 인증을 추가한다.

### Hard Constraint

- 미리보기는 `react-live`의 `noInline` 모드다 (`src/components/LivePreview.tsx:14`). 생성 코드에 `render(<Component />)` 호출이 없으면 아무것도 그려지지 않는다. 또 생성 코드는 import 없이 전역 `React`만 쓰고 TypeScript 문법을 쓸 수 없다 (`server/index.ts:11-12`, `server/index.ts:20`).
- `server/index.ts`의 에러 분기는 에러 메시지 문자열에 상태 코드가 들어 있다고 가정한다 (`message.includes('503')`, `'429'`: `server/index.ts:194`, `server/index.ts:201`). 메시지를 던지는 쪽 (`server/index.ts:85`, `server/index.ts:112`)의 `${response.status}` 형식을 바꾸면 503/429 안내가 사라진다.
- 개발 프록시 포트 3002가 두 곳에 하드코딩되어 있다 (`vite.config.ts:11`, `server/index.ts:139`). 한쪽만 바꾸면 `/api` 호출이 끊긴다.
- `tsc -b`는 `src/`와 `vite.config.ts`만 검사한다 (`tsconfig.app.json` include, `tsconfig.node.json` include). `server/`의 타입 오류는 `bun run build`가 잡지 못한다. `server/`를 수정했다면 타입 검증이 빌드 통과로 증명되지 않는다는 점을 보고한다.

### Double Defense

- 생성 코드 정규화가 프롬프트와 후처리 양쪽에 있다. 프롬프트는 "render() 호출", "마크다운 펜스 금지"를 요구하고 (`server/index.ts:12`, `server/index.ts:16`), 서버는 모델이 어겨도 `stripCodeFences`와 `ensureRenderCall`로 고친다 (`server/index.ts:188`, `server/generator.ts:4-24`). 한쪽을 제거하면 모델 변경 시 미리보기가 깨지므로 둘 다 유지한다.

### Asymmetry

- Google 경로에만 모델 폴백 (`server/index.ts:134-136`)과 `MAX_TOKENS` 잘림 검사 (`server/index.ts:123`)가 있고, Anthropic 경로 (`server/index.ts:68-96`)에는 둘 다 없다. 토큰 한도도 다르다 (Anthropic 4096, Google 8192). 프로바이더 동작을 바꿀 때 두 경로를 서로 대칭으로 가정하지 않고 각각 확인한다.

### Test Boundary

- 테스트가 있는 곳: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`, `src/utils/`, `src/hooks/usePersistentState.ts`. 저장·복원 동작에 한해 `src/hooks/useComponentGenerator.ts`와 `src/App.tsx`에도 있다. 없는 곳: `server/index.ts`, `LivePreview`, `ComponentCard`, 그리고 두 파일의 생성 요청·에러 처리.
- 새 로직은 테스트 가능한 순수 모듈로 분리한다. `server/generator.ts`가 그 선례다 (`server/generator.ts:1-2`: 부수효과가 없어 단위 테스트가 가능하다). `server/index.ts`는 import 시점에 `Bun.serve`로 서버를 띄우므로 (`server/index.ts:138`) 테스트에서 import하지 않는다.

## Project Context

- 목적: 프롬프트로 React 컴포넌트를 생성하고 미리보기와 코드를 제공하는 학습용 도구.
- Stack: React 19, TypeScript, Vite, react-live, Bun(API 서버), Vitest, Testing Library.

## Standards & References

- 설치, 실행, 기능 설명은 `README.md`를 따른다. 여기에 반복하지 않는다.
- 커밋 메시지: `<type>: <한국어 요약>`. type은 `feat`, `fix`, `refactor`, `chore`. 필요하면 본문에 이유를 한두 문장으로 쓴다.
- Maintenance Policy: 이 문서의 규칙과 코드가 어긋난 것을 발견하면 작업을 멈추지 말고, 작업 종료 시 AGENTS.md 수정을 제안한다.

## Context Map

- **[server/ 수정 (Bun API 서버)](./server/AGENTS.md)** — 프로바이더 호출, 프롬프트, 에러 처리, 서버 테스트를 건드릴 때.
- **[src/ 수정 (React 프론트엔드)](./src/AGENTS.md)** — 컴포넌트, 훅, 미리보기, 프론트 테스트를 건드릴 때.
