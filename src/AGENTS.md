# src/AGENTS.md

## Module Context

Vite로 빌드되는 브라우저 프론트엔드. `useComponentGenerator` 훅이 `/api/generate`를 호출하고, `ComponentCard`가 결과를 미리보기(react-live)와 코드 탭으로 보여준다.

## Tech Stack & Constraints

- TypeScript 컴파일러 옵션이 엄격하다 (`tsconfig.app.json`). 아래를 어기면 `bun run build`가 실패한다.
  - `erasableSyntaxOnly`: enum, namespace, 생성자 파라미터 프로퍼티를 쓰지 않는다.
  - `verbatimModuleSyntax`: 타입은 `import type`으로 가져온다 (예: `src/App.tsx:5`).
  - `noUnusedLocals`, `noUnusedParameters`: 쓰지 않는 변수와 파라미터를 남기지 않는다.
- 서버 호출은 상대 경로(`/api/...`)만 쓴다 (`src/hooks/useComponentGenerator.ts:23`, `src/App.tsx:25`). `http://localhost:3002`를 직접 쓰지 않는다. 개발 중에는 Vite 프록시가 연결한다.
- ESLint는 `react-hooks` flat recommended와 `react-refresh/vite` 규칙을 쓴다 (`eslint.config.js:15-16`). 컴포넌트 파일에서 컴포넌트 외 값을 export하면 react-refresh 경고가 난다. 타입과 상수는 `src/types/` 등 별도 파일에 둔다.

## Implementation Patterns

- 컴포넌트는 `src/components/PascalCase.tsx`에 named export로 둔다 (`App.tsx`만 default export). props 타입은 같은 파일의 `interface XxxProps`로 정의한다.
- 서버 응답이나 프로바이더 같은 공유 타입은 `src/types/index.ts`에 둔다. `Provider` 유니온은 서버에도 같은 정의가 있다 (`server/index.ts:57`). 값을 추가하면 두 곳을 함께 바꾼다.
- 미리보기 새로고침은 `LivePreview`의 `key`를 바꿔 리마운트하는 방식이다 (`src/components/ComponentCard.tsx:70`). 애니메이션 컴포넌트를 다시 재생하는 기능이므로 상태 초기화 방식으로 바꾸지 않는다.

## Testing Strategy

- 테스트는 `*.test.tsx`를 대상 컴포넌트 옆에 둔다 (`src/components/PromptInput.test.tsx`). Testing Library의 역할 기반 쿼리와 `userEvent`를 쓰고, 이름은 한국어 문장이다.
- `src/test/setup.ts`가 jest-dom 매처 등록과 테스트 간 `cleanup`을 맡는다. 개별 테스트에서 중복 설정하지 않는다.
- 실행은 루트에서 `bun run test`. 환경은 jsdom이고 CSS는 로드하지 않는다 (`vite.config.ts` test 설정).

## Local Golden Rules

- 생성된 코드는 신뢰할 수 없는 문자열이며 `react-live`가 런타임에서 실행한다 (`LivePreview.tsx:14`). 생성 코드를 다른 곳에서 `eval`하거나 `dangerouslySetInnerHTML`로 넣지 않는다. 코드 표시는 `<pre><code>{code}</code></pre>`처럼 텍스트로만 한다 (`src/components/CodeView.tsx:24-26`).
- 사용자가 입력한 API 키는 컴포넌트 상태에만 둔다 (`src/App.tsx:14`). 프로바이더를 바꾸면 입력 키를 비운다 (`src/App.tsx:41-44`). 이 초기화는 다른 프로바이더로 키가 전송되는 것을 막으므로 유지한다.
- `src/hooks/`, `src/App.tsx`, `ComponentCard`, `LivePreview`에는 테스트가 없다. 훅의 에러 처리나 상태 전이를 수정하면 훅 단위 테스트를 함께 추가하는 쪽을 우선한다.
