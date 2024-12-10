import { DID, HOST, METRICS_PORT, PORT, SIGNING_KEY } from './config.js';
import { startLabelerServer } from './label.js';
import logger from './logger.js';
import { startMetricsServer } from './metrics.js';

const metricsServer = startMetricsServer(METRICS_PORT, HOST);
const labelerServer = startLabelerServer({ did: DID, signingKey: SIGNING_KEY }, PORT, HOST);

function shutdown() {
  try {
    logger.info('Shutting down gracefully...');
    labelerServer.stop();
    metricsServer.close();
  } catch (error) {
    logger.error(`Error shutting down gracefully: ${error}`);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
