import { app } from './app.js';

const port = Number(process.env.PORT || 3002);
const server = app.listen(port, () => {
  console.log(`order-notifications-service listening on http://localhost:${port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`order-notifications-service received ${signal}; shutting down`);
  server.close((error) => {
    if (error) {
      console.error('order-notifications-service failed to shut down cleanly', error);
      process.exitCode = 1;
    }
    process.exit();
  });
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => shutdown(signal));
}
