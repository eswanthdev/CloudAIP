import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { verifyEmailConnection } from './config/email.js';
import app from './app.js';

async function main(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Verify email transporter (non-blocking)
    verifyEmailConnection().catch(() => {});

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`CloudAIP server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
