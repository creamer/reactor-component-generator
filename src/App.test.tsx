import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEYS } from './utils/storage';

// 서버 키가 연결된 상태로 만들고, 생성 요청은 실패시켜 LivePreview 렌더링을 피한다.
function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url === '/api/config'
        ? { ok: true, json: async () => ({ envKeys: { anthropic: true, google: true } }) }
        : { ok: false, json: async () => ({ error: '테스트용 오류' }) },
    ),
  );
}

describe('App 상태 저장·복원', () => {
  beforeEach(() => {
    localStorage.clear();
    stubFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('저장된 provider를 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('anthropic'));

    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
  });

  it('provider를 바꾸면 저장한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');

    expect(localStorage.getItem(STORAGE_KEYS.provider)).toBe('"anthropic"');
  });

  it('제출한 프롬프트를 히스토리에 저장하고 최근 프롬프트로 보여준다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByPlaceholderText(/서버 키 사용 중/);

    await user.type(screen.getByRole('textbox', { name: '' }), '프로필 카드');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

    expect(await screen.findByRole('button', { name: '프로필 카드' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.promptHistory) ?? 'null')).toEqual([
      '프로필 카드',
    ]);
  });

  it('입력한 API 키는 어떤 localStorage 항목에도 저장되지 않는다', async () => {
    const dummyKey = 'dummy-key-for-test';
    const user = userEvent.setup();
    render(<App />);
    await screen.findByPlaceholderText(/서버 키 사용 중/);

    await user.type(screen.getByLabelText('API Key'), dummyKey);
    await user.type(screen.getByRole('textbox', { name: '' }), '프로필 카드');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByRole('button', { name: '프로필 카드' });

    const stored = Object.keys(localStorage).map((key) => localStorage.getItem(key) ?? '');
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.join('\n')).not.toContain(dummyKey);
  });
});
