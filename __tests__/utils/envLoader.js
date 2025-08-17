/**
 * Environment variable loader utility
 * Loads environment variables from .env files without external dependencies
 */

const fs = require('fs');
const path = require('path');

/**
 * Manually parse a .env file and set environment variables
 * @param {string} filePath - Path to the .env file
 * @returns {Object} Parsed environment variables
 */
function parseEnvFile(filePath) {
  const envVars = {};
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Environment file not found: ${filePath}`);
      return envVars;
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    
    lines.forEach(line => {
      // Skip empty lines and comments
      if (line.trim() === '' || line.startsWith('#')) {
        return;
      }
      
      // Parse KEY=VALUE pairs
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return {};
  }
}

/**
 * Load environment variables from .env.local file
 * @param {string} basePath - Base path to look for .env.local file (defaults to project root)
 * @returns {Object} Loaded environment variables
 */
function loadEnvLocal(basePath = path.resolve(__dirname, '../../')) {
  const envPath = path.resolve(basePath, '.env.local');
  const envVars = parseEnvFile(envPath);
  
  // Set environment variables
  for (const key in envVars) {
    process.env[key] = envVars[key];
  }
  
  return envVars;
}

/**
 * Load environment variables from a specified .env file
 * @param {string} envFileName - Name of the .env file (e.g., '.env.test')
 * @param {string} basePath - Base path to look for the .env file (defaults to project root)
 * @returns {Object} Loaded environment variables
 */
function loadEnvFile(envFileName, basePath = path.resolve(__dirname, '../../')) {
  const envPath = path.resolve(basePath, envFileName);
  const envVars = parseEnvFile(envPath);
  
  // Set environment variables
  for (const key in envVars) {
    process.env[key] = envVars[key];
  }
  
  return envVars;
}

module.exports = {
  parseEnvFile,
  loadEnvLocal,
  loadEnvFile
};