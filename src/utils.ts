import { GITHUB_PAT } from './config.js';

export async function fetchGithubJson<T>(url: string): Promise<T> {
  let headers = new Headers({
    Accept: 'application/vnd.github.v3.raw',
    'Cache-Control': 'nocache',
  });

  if (GITHUB_PAT) {
    headers.append('Authorization', `Bearer ${GITHUB_PAT}`);
  }

  const resp = await fetch(url, {
    method: 'GET',
    headers: headers,
  });

  if (!resp.ok) {
    throw new Error(resp.statusText);
  }

  return resp.json() as T;
}
