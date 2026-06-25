import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import { blockchainService } from './services/blockchain.service';

async function main() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start server
    app.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 NEXUS SRM - Supplier Relationship Management        ║
║                                                           ║
║   Server running on port ${env.PORT}                        ║
║   Environment: ${env.NODE_ENV.padEnd(32)}║
║   Blockchain: ${blockchainService.getConfigStatus().configured ? 'Enabled (Polygon)' : 'Mock Mode'.padEnd(24)}║
║                                                           ║
║   API Endpoints:                                          ║
║   - POST   /api/auth/register                             ║
║   - POST   /api/auth/login                                ║
║   - GET    /api/auth/me                                   ║
║   - GET    /api/companies/search                          ║
║   - POST   /api/documents                                 ║
║   - POST   /api/rfqs                                      ║
║   - POST   /api/quotes                                    ║
║                                                           ║
║   Built with ❤️  for the world's best SRM platform        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
