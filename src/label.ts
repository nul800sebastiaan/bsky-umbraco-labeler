import { ComAtprotoLabelDefs } from '@atproto/api';
import { LabelerOptions, LabelerServer, ProcedureHandler } from '@skyware/labeler';

import { LABELS } from './constants.js';
import logger from './logger.js';
import { Account } from './types.js';
import { fetchGithubJson } from './utils.js';

export const startLabelerServer = (options: LabelerOptions, port: number = 4100, host = '127.0.0.1') => {
  const labelerServer = new LabelerServer(options);

  const fetchLabelAssignments = (label: string) => {
    // Fetch latest entries for a given label
    var labels = labelerServer.db
      .prepare<string[]>(`SELECT src, uri, val, MAX(cts) as cts FROM labels WHERE val = ? GROUP BY src, uri, val`)
      .all(label) as ComAtprotoLabelDefs.Label[];

    // Return labels excluding negated
    return labels.filter((x) => !x.neg);
  };

  const syncLabelsHandler: ProcedureHandler = async (req, res) => {
    // Setup a result handler to signal added / removed count
    let result = {
      added: 0,
      removed: 0,
    };

    // Loop through supported label types
    for (const label of LABELS) {
      console.log(`Syncing "${label.identifier}" label`);

      // Get current labels
      const labelAssignments = fetchLabelAssignments(label.identifier);

      // Fetch the members JSON
      const members = await fetchGithubJson<Account[]>(
        `https://api.github.com/repos/mattbrailsford/bsky-umbraco-labeler/contents/data/${label.identifier}.json`,
      );

      // Add new members
      const newMembers = members.filter((x) => !labelAssignments.some((y) => y.uri === x.did));
      newMembers.forEach((x) => {
        labelerServer.createLabel({ uri: x.did, val: label.identifier });
        console.log(`Adding "${label.identifier}" label to ${x.did}`);
        result.added++;
      });

      // Delete removed members
      const delMembers = labelAssignments.filter((x) => !members.some((y) => y.did === x.uri));
      delMembers.forEach((x) => {
        labelerServer.createLabel({ uri: x.uri, val: label.identifier, neg: true });
        console.log(`Removing "${label.identifier}" label from ${x.uri}`);
        result.removed++;
      });
    }

    return res.send(result);
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
  }, 250);

  return labelerServer;
};
