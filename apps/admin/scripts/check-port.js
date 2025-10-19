#!/usr/bin/env node
/**
 * Port availability check script
 * 
 * Checks if port 3000 is available before starting the server.
 * If port 3000 is occupied, automatically tries 3001, 3002, etc.
 * 
 * Ref: https://nodejs.org/docs/latest-v20.x/api/net.html#netcreateserveroptions-connectionlistener
 */

const net = require('net');

const DEFAULT_PORT = 3000;
const MAX_ATTEMPTS = 10;

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Find next available port
 * @param {number} startPort - Starting port number
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const port = startPort + i;
    const isAvailable = await checkPort(port);
    
    if (isAvailable) {
      return port;
    }
    
    console.warn(`⚠️  Port ${port} is already in use`);
  }
  
  throw new Error(`❌ Could not find available port after ${MAX_ATTEMPTS} attempts`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    
    if (port !== DEFAULT_PORT) {
      console.log(`\n⚠️  Port ${DEFAULT_PORT} was occupied, using port ${port} instead\n`);
      console.log(`   Local:            http://localhost:${port}`);
      console.log(`   Network:          http://<your-ip>:${port}`);
      console.log(`\n   For Guardian: Update health check URL to http://localhost:${port}/api/health\n`);
      
      // Set PORT env var for Next.js
      process.env.PORT = String(port);
    } else {
      console.log(`✅ Port ${DEFAULT_PORT} is available`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
