/**
 * One-time migration: backfill username, firstName, lastName on existing user docs.
 * Only sets fields that are missing ($exists: false) — never overwrites existing data.
 * Creates the unique index on username after all docs are updated.
 * Move to scripts/archive/ when done.
 *
 * Usage: node scripts/migrate-users.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dir = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
	readFileSync(join(__dir, '..', '.env'), 'utf-8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
		.map((l) => {
			const idx = l.indexOf('=');
			return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
		})
);

const DB_URI = env.DB_URI;
const DB_NAME = env.DB_NAME || 'mt-rankings';

// ── derive username from email ─────────────────────────────────────────────────

const deriveUsername = (email) => {
	const local = email.split('@')[0];
	// admin@... → "admin" regardless of the local part
	if (email.startsWith('admin@')) return 'admin';
	return local.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

// Ensure uniqueness: if derived username is taken, append _2, _3, …
const uniqueUsername = (base, taken) => {
	if (!taken.has(base)) return base;
	let n = 2;
	while (taken.has(`${base}_${n}`)) n++;
	return `${base}_${n}`;
};

const capitalize = (str) => (str ? str[0].toUpperCase() + str.slice(1) : '');

// ── main ───────────────────────────────────────────────────────────────────────

const client = new MongoClient(DB_URI);

try {
	await client.connect();
	const db = client.db(DB_NAME);
	const users = db.collection('users');

	const all = await users.find({}).toArray();
	console.log(`Found ${all.length} user doc(s).`);

	// Collect already-assigned usernames to avoid collisions during migration
	const existingUsernames = new Set(
		all.filter((u) => u.username).map((u) => u.username)
	);

	let updated = 0;

	for (const user of all) {
		const $set = {};

		if (!user.username) {
			const base = deriveUsername(user.email);
			const username = uniqueUsername(base, existingUsernames);
			existingUsernames.add(username);
			$set.username = username;
		}

		const resolvedUsername = $set.username ?? user.username ?? '';

		if (!user.firstName) {
			$set.firstName = capitalize(resolvedUsername);
		}

		if (user.lastName === undefined || user.lastName === null) {
			$set.lastName = '';
		}

		if (Object.keys($set).length === 0) {
			console.log(`  [skip]   ${user.email} — all fields present`);
			continue;
		}

		await users.updateOne(
			{ _id: user._id },
			{ $set }
		);

		const parts = Object.entries($set).map(([k, v]) => `${k}: "${v}"`).join(', ');
		console.log(`  [update] ${user.email} → ${parts}`);
		updated++;
	}

	console.log(`\nUpdated ${updated} of ${all.length} user(s).`);

	// Create unique index on username now that all docs have the field
	await users.createIndex({ username: 1 }, { unique: true });
	console.log('Unique index on username: created (or already exists).');

	console.log('\nMigration complete. Move this script to scripts/archive/.');
} finally {
	await client.close();
}
