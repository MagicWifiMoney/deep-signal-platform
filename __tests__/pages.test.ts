/**
 * Page smoke tests
 * Validates that key page files exist and export a default component.
 * Full render tests are skipped — Next.js pages require server context
 * (auth, routing, Convex) that is out of scope for unit tests.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PAGES_ROOT = path.resolve(__dirname, '../src/app');

function pageExists(pagePath: string): boolean {
  return existsSync(path.join(PAGES_ROOT, pagePath));
}

function hasDefaultExport(pagePath: string): boolean {
  if (!pageExists(pagePath)) return false;
  const content = readFileSync(path.join(PAGES_ROOT, pagePath), 'utf-8');
  return /export\s+default\s+(?:function|class|const|async)/.test(content);
}

function isClientComponent(pagePath: string): boolean {
  if (!pageExists(pagePath)) return false;
  const content = readFileSync(path.join(PAGES_ROOT, pagePath), 'utf-8');
  return content.includes("'use client'") || content.includes('"use client"');
}

describe('Page files exist', () => {
  it('root page exists (page.tsx)', () => {
    expect(pageExists('page.tsx')).toBe(true);
  });

  it('onboarding page exists', () => {
    expect(pageExists('onboarding/page.tsx')).toBe(true);
  });

  it('dashboard page exists', () => {
    expect(pageExists('dashboard/page.tsx')).toBe(true);
  });

  it('dashboard/analytics page exists', () => {
    expect(pageExists('dashboard/analytics/page.tsx')).toBe(true);
  });

  it('dashboard/billing page exists', () => {
    expect(pageExists('dashboard/billing/page.tsx')).toBe(true);
  });

  it('dashboard/settings page exists', () => {
    expect(pageExists('dashboard/settings/page.tsx')).toBe(true);
  });

  it('dashboard/usage page exists', () => {
    expect(pageExists('dashboard/usage/page.tsx')).toBe(true);
  });

  it('mission-control page exists', () => {
    expect(pageExists('mission-control/page.tsx')).toBe(true);
  });

  it('sign-in page exists', () => {
    expect(pageExists('sign-in/[[...sign-in]]/page.tsx')).toBe(true);
  });

  it('sign-up page exists', () => {
    expect(pageExists('sign-up/[[...sign-up]]/page.tsx')).toBe(true);
  });

  it('setup page exists', () => {
    expect(pageExists('setup/page.tsx')).toBe(true);
  });
});

describe('Page components export a default component', () => {
  it('root page has default export', () => {
    expect(hasDefaultExport('page.tsx')).toBe(true);
  });

  it('onboarding page has default export', () => {
    expect(hasDefaultExport('onboarding/page.tsx')).toBe(true);
  });

  it('dashboard page has default export', () => {
    expect(hasDefaultExport('dashboard/page.tsx')).toBe(true);
  });

  it('dashboard/analytics page has default export', () => {
    expect(hasDefaultExport('dashboard/analytics/page.tsx')).toBe(true);
  });

  it('dashboard/billing page has default export', () => {
    expect(hasDefaultExport('dashboard/billing/page.tsx')).toBe(true);
  });

  it('dashboard/settings page has default export', () => {
    expect(hasDefaultExport('dashboard/settings/page.tsx')).toBe(true);
  });

  it('mission-control page has default export', () => {
    expect(hasDefaultExport('mission-control/page.tsx')).toBe(true);
  });
});

describe('Page component directives', () => {
  it('root page is a client component', () => {
    expect(isClientComponent('page.tsx')).toBe(true);
  });

  it('onboarding page is a client component', () => {
    expect(isClientComponent('onboarding/page.tsx')).toBe(true);
  });

  it('dashboard page is a client component', () => {
    expect(isClientComponent('dashboard/page.tsx')).toBe(true);
  });
});

describe('App layout', () => {
  it('root layout exists', () => {
    expect(pageExists('layout.tsx')).toBe(true);
  });

  it('root layout has default export', () => {
    expect(hasDefaultExport('layout.tsx')).toBe(true);
  });
});
