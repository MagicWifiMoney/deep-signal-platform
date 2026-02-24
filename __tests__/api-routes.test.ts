import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const API_ROOT = path.resolve(__dirname, '../src/app/api');

function routeExists(routePath: string): boolean {
  return existsSync(path.join(API_ROOT, routePath, 'route.ts'));
}

function routeExports(routePath: string, method: string): boolean {
  const filePath = path.join(API_ROOT, routePath, 'route.ts');
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, 'utf-8');
  // Match "export async function METHOD" or "export function METHOD"
  return new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(content);
}

describe('API route files exist', () => {
  it('analyze-company route exists', () => {
    expect(routeExists('analyze-company')).toBe(true);
  });

  it('billing route exists', () => {
    expect(routeExists('billing')).toBe(true);
  });

  it('channels/configure route exists', () => {
    expect(routeExists('channels/configure')).toBe(true);
  });

  it('instances route exists', () => {
    expect(routeExists('instances')).toBe(true);
  });

  it('knowledge/upload route exists', () => {
    expect(routeExists('knowledge/upload')).toBe(true);
  });

  it('onboard route exists', () => {
    expect(routeExists('onboard')).toBe(true);
  });

  it('settings route exists', () => {
    expect(routeExists('settings')).toBe(true);
  });

  it('slack/callback route exists', () => {
    expect(routeExists('slack/callback')).toBe(true);
  });

  it('usage route exists', () => {
    expect(routeExists('usage')).toBe(true);
  });
});

describe('API route HTTP method exports', () => {
  it('analyze-company exports POST', () => {
    expect(routeExports('analyze-company', 'POST')).toBe(true);
  });

  it('billing exports GET', () => {
    expect(routeExports('billing', 'GET')).toBe(true);
  });

  it('channels/configure exports POST', () => {
    expect(routeExports('channels/configure', 'POST')).toBe(true);
  });

  it('instances exports GET', () => {
    expect(routeExports('instances', 'GET')).toBe(true);
  });

  it('knowledge/upload exports POST', () => {
    expect(routeExports('knowledge/upload', 'POST')).toBe(true);
  });

  it('onboard exports POST', () => {
    expect(routeExports('onboard', 'POST')).toBe(true);
  });

  it('onboard exports GET', () => {
    expect(routeExports('onboard', 'GET')).toBe(true);
  });

  it('settings exports GET', () => {
    expect(routeExports('settings', 'GET')).toBe(true);
  });

  it('settings exports PUT', () => {
    expect(routeExports('settings', 'PUT')).toBe(true);
  });

  it('slack/callback exports GET', () => {
    expect(routeExports('slack/callback', 'GET')).toBe(true);
  });

  it('usage exports GET', () => {
    expect(routeExports('usage', 'GET')).toBe(true);
  });
});
