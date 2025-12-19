#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates and populates the SQLite database for the Vulnerable MCP Server
 *
 * Created by IntegSec (https://integsec.com)
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'data', 'database.sqlite');

console.log('🔧 Setting up Vulnerable MCP Server database...\n');

// Ensure data directory exists
const dataDir = join(projectRoot, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Create/open database
const db = new Database(dbPath);
console.log(`✅ Database created at: ${dbPath}\n`);

// Create users table
console.log('📋 Creating tables...');

db.exec(`
  DROP TABLE IF EXISTS users;
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    secret TEXT
  );
`);
console.log('  ✓ users table created');

// Create flags table (for SQL injection challenge)
db.exec(`
  DROP TABLE IF EXISTS flags;
  CREATE TABLE flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flag TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL
  );
`);
console.log('  ✓ flags table created');

// Create secrets table
db.exec(`
  DROP TABLE IF EXISTS secrets;
  CREATE TABLE secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    secret_key TEXT NOT NULL,
    secret_value TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
console.log('  ✓ secrets table created\n');

// Insert sample users
console.log('👥 Inserting sample users...');

const insertUser = db.prepare(`
  INSERT INTO users (username, email, password, role, secret)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('admin', 'admin@vulnerable-mcp.local', 'admin123', 'administrator', 'Admin secret key: sk-admin-12345');
insertUser.run('alice', 'alice@vulnerable-mcp.local', 'password123', 'user', null);
insertUser.run('bob', 'bob@vulnerable-mcp.local', 'bob2024', 'user', 'Bob\\'s API key: sk-bob-67890');
insertUser.run('charlie', 'charlie@vulnerable-mcp.local', 'charlie!', 'moderator', null);
insertUser.run('eve', 'eve@vulnerable-mcp.local', 'eve123', 'user', null);

console.log('  ✓ Inserted 5 users\n');

// Insert CTF flags
console.log('🚩 Inserting CTF flags...');

const insertFlag = db.prepare(`
  INSERT INTO flags (flag, category, difficulty)
  VALUES (?, ?, ?)
`);

insertFlag.run('FLAG{sql_ninja}', 'SQL Injection', 'Medium');
insertFlag.run('FLAG{database_master}', 'SQL Injection', 'Hard');
insertFlag.run('FLAG{union_select_champion}', 'SQL Injection', 'Hard');

console.log('  ✓ Inserted 3 flags\n');

// Insert secrets
console.log('🔐 Inserting user secrets...');

const insertSecret = db.prepare(`
  INSERT INTO secrets (user_id, secret_key, secret_value)
  VALUES (?, ?, ?)
`);

insertSecret.run(1, 'admin_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.vulnerable');
insertSecret.run(2, 'alice_api_key', 'sk-alice-xyz789');
insertSecret.run(3, 'bob_password', 'super_secret_password');

console.log('  ✓ Inserted 3 secrets\n');

// Verify data
console.log('🔍 Verifying database...');

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
const flagCount = db.prepare('SELECT COUNT(*) as count FROM flags').get();
const secretCount = db.prepare('SELECT COUNT(*) as count FROM secrets').get();

console.log(`  ✓ Users: ${userCount.count}`);
console.log(`  ✓ Flags: ${flagCount.count}`);
console.log(`  ✓ Secrets: ${secretCount.count}\n`);

// Close database
db.close();

console.log('✨ Database setup complete!\n');
console.log('📖 SQL Injection Examples:');
console.log('   username: admin\'--');
console.log('   username: \' OR \'1\'=\'1');
console.log('   username: \' UNION SELECT * FROM flags--\n');

console.log('⚠️  This database is intentionally vulnerable!');
console.log('   Created by IntegSec (https://integsec.com)\n');
