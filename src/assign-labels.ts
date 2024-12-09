import { LabelerServer } from '@skyware/labeler';

import { DID, SIGNING_KEY } from './config.js';
import { UMB_HQ_MEMBERS } from './constants.js';
import logger from './logger.js';

export const labelerServer = new LabelerServer({ did: DID, signingKey: SIGNING_KEY });

for (const mbr of UMB_HQ_MEMBERS) {
  try {
    labelerServer.createLabel({ uri: mbr.did, val: 'umbraco-hq' });
    logger.info('Successfully assigned labels');
  } catch (error) {
    logger.error(`Error deleting all labels: ${error}`);
  }
}
