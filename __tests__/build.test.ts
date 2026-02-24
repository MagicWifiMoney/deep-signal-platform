/**
 * Build smoke test
 * Runs `npm run build` and verifies it exits with code 0.
 * This is the highest-value test: catches TypeScript errors, import failures,
 * and broken configs that would block production deployment.
 */
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Next.js build', () => {
  it('npm run build succeeds (exit code 0)', () => {
    let exitCode = 0;
    let output = '';
    try {
      output = execSync('npm run build', {
        cwd: PROJECT_ROOT,
        timeout: 120_000,
        encoding: 'utf-8',
        env: {
          ...process.env,
          // Use "placeholder" keys — the layout/middleware guard checks .includes('placeholder')
          // and skips ClerkProvider when present, allowing the build to succeed without real keys.
          // NEXT_PUBLIC_CONVEX_URL intentionally NOT set if undefined — ConvexClientProvider has
          // a null-guard that skips the provider when the URL is missing.
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder',
          CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_placeholder',
          HETZNER_API_TOKEN: process.env.HETZNER_API_TOKEN || 'stub-hetzner-token',
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'stub-gemini-key',
          NODE_ENV: 'production',
        },
      });
    } catch (err: unknown) {
      exitCode = (err as NodeJS.ErrnoException & { status?: number }).status ?? 1;
      output = (err as NodeJS.ErrnoException & { stdout?: string; stderr?: string }).stdout ?? '';
      const stderr = (err as NodeJS.ErrnoException & { stdout?: string; stderr?: string }).stderr ?? '';
      // Print build output to help debug failures
      console.error('Build failed!\nSTDOUT:', output, '\nSTDERR:', stderr);
    }

    expect(exitCode, 'Build should exit with code 0').toBe(0);
  }, 130_000); // slightly longer than execSync timeout
});
