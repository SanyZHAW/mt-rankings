/**
 * Promote a user to admin role.
 *
 * Usage (Node 20.6+):
 *   node --env-file=.env scripts/seed-admin.js
 *
 * Required env vars:
 *   DB_URI        MongoDB connection string
 *   ADMIN_EMAIL   Email of the user to promote
 *
 * Optional:
 *   DB_NAME       Database name (default: mt-rankings)
 */

import { MongoClient } from 'mongodb';

const { DB_URI, DB_NAME = 'mt-rankings', ADMIN_EMAIL } = process.env;

if (!DB_URI) {
	console.error('Error: DB_URI is not set.');
	process.exit(1);
}
if (!ADMIN_EMAIL) {
	console.error('Error: ADMIN_EMAIL is not set.');
	process.exit(1);
}

const client = new MongoClient(DB_URI);

try {
	await client.connect();
	const db = client.db(DB_NAME);
	const users = db.collection('users');

	const email = ADMIN_EMAIL.trim().toLowerCase();
	const result = await users.updateOne({ email }, { $set: { role: 'admin' } });

	if (result.matchedCount === 0) {
		console.error(`No user found with email: ${email}`);
		process.exit(1);
	}

	console.log(`OK: ${email} is now an admin.`);
} finally {
	await client.close();
}
