import { HOST, METRICS_PORT, PORT } from './config.js';
import { labelerServer } from './label.js';
import logger from './logger.js';
import { startMetricsServer } from './metrics.js';

const metricsServer = startMetricsServer(METRICS_PORT);

labelerServer.app.listen({ port: PORT, host: HOST }, (error, address) => {
  if (error) {
    logger.error('Error starting server: %s', error);
  } else {
    logger.info(`Labeler server listening on ${address}`);
  }
});

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
