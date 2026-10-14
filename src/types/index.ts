export const PROVIDERS = ['anthropic', 'google'] as const;

export type Provider = (typeof PROVIDERS)[number];

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
}
