import { ComAtprotoLabelDefs } from '@atproto/api';
import { LabelerOptions, LabelerServer, ProcedureHandler } from '@skyware/labeler';

import logger from './logger.js';
import { Account } from './types.js';

export const startLabelerServer = (options: LabelerOptions, port: number = 4100, host = '127.0.0.1') => {
  const labelerServer = new LabelerServer(options);

  async function fetchGithubJson<T>(url: string): Promise<T> {
    let headers = new Headers({
      Accept: 'application/vnd.github.v3.raw',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36 Edg/99.0.1150.36',
      'Cache-Control': 'nocache',
    });

    const resp = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!resp.ok) {
      throw new Error(resp.statusText);
    }

    return resp.json() as T;
  }

  const fetchCurrentActiveLabels = () => {
    return labelerServer.db
      .prepare<
        string[]
      >(`SELECT src, uri, val, MAX(CASE WHEN neg == true THEN 0 ELSE cts END) as cts FROM labels GROUP BY src, uri, val`)
      .all() as ComAtprotoLabelDefs.Label[];
  };

  const syncLabelsHandler: ProcedureHandler = async (req, res) => {
    // Fetch JSON
    const hqMembers = await fetchGithubJson<Account[]>(
      'https://api.github.com/repos/mattbrailsford/bsky-umbraco-labeler/contents/data/umbraco-hq.json',
    );
    const mvpMembers = (
      await fetchGithubJson<Account[]>(
        'https://api.github.com/repos/mattbrailsford/bsky-umbraco-labeler/contents/data/umbraco-mvp.json',
      )
    ).filter((x) => !hqMembers.some((y) => y.did === x.did)); // HQ Members can't also be MVPs

    // Get current labels
    const currentLabels = fetchCurrentActiveLabels();

    // Add labels
    const newHqMembers = hqMembers.filter((x) => !currentLabels.some((y) => y.uri === x.did));
    newHqMembers.forEach((x) => {
      labelerServer.createLabel({ uri: x.did, val: 'umbraco-hq' });
    });

    const newMvpMembers = mvpMembers.filter((x) => !currentLabels.some((y) => y.uri === x.did));
    newMvpMembers.forEach((x) => {
      labelerServer.createLabel({ uri: x.did, val: 'umbraco-mvp' });
    });

    // Delete labels
    const delHqMembers = currentLabels.filter((x) => !hqMembers.some((y) => y.did === x.uri));
    delHqMembers.forEach((x) => {
      labelerServer.createLabel({ uri: x.uri, val: 'umbraco-hq', neg: true });
    });

    const delMvpMembers = currentLabels.filter((x) => !mvpMembers.some((y) => y.did === x.uri));
    delMvpMembers.forEach((x) => {
      labelerServer.createLabel({ uri: x.uri, val: 'umbraco-mvp', neg: true });
    });

    return res.send();
  };

  // We need to give the labeler service time to initialize as it
  // runs a promise during construction but we need to wait for
  // that promise to resolve before we can add our own endpoint
  setTimeout(() => {
    labelerServer.app.post('/sync-labels', syncLabelsHandler);

    labelerServer.app.listen({ port, host }, (error, address) => {
      if (error) {
        logger.error('Error starting server: %s', error);
      } else {
        logger.info(`Labeler server listening on ${address}`);
      }
    });
  }, 100);

  return labelerServer;
};
