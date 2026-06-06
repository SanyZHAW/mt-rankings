/**
 * One-time migration: backfill `normalizedName` on all fighter docs that lack it,
 * and merge duplicate docs caused by missed dedup (e.g. rws-hercules-best-chaouad
 * vs fighter-hercules-best-chaouad existing side-by-side).
 *
 * Run ONCE before or after sync. Safe to re-run.
 * Usage: node scripts/migrate-normalized-name.mjs
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

const normalizeForDedup = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const client = new MongoClient(DB_URI);

try {
	await client.connect();
	const db = client.db(DB_NAME);
	const fighters = db.collection('fighters');

	// ── Step 1: backfill normalizedName on docs that lack it ─────────────────────
	const withoutNorm = await fighters.find({ normalizedName: { $exists: false } }).toArray();
	console.log(`Backfilling normalizedName on ${withoutNorm.length} doc(s)...`);
	for (const doc of withoutNorm) {
		await fighters.updateOne(
			{ _id: doc._id },
			{ $set: { normalizedName: normalizeForDedup(doc.name) } }
		);
	}
	console.log('Backfill done.');

	// ── Step 2: find duplicate pairs (same normalizedName, different _id) ─────────
	const allFighters = await fighters.find({}).toArray();

	// Group by normalizedName
	const byNorm = {};
	for (const f of allFighters) {
		const key = f.normalizedName ?? normalizeForDedup(f.name);
		if (!byNorm[key]) byNorm[key] = [];
		byNorm[key].push(f);
	}

	const dupes = Object.entries(byNorm).filter(([, group]) => group.length > 1);
	console.log(`Found ${dupes.length} duplicate group(s):`);

	for (const [norm, group] of dupes) {
		// Canonical = prefer fighter- prefix; fallback to first
		const canonical =
			group.find((f) => f._id.startsWith('fighter-')) ?? group[0];
		const extras = group.filter((f) => f._id !== canonical._id);

		console.log(`  [${norm}] canonical: ${canonical._id}`);
		for (const extra of extras) {
			console.log(`    merging: ${extra._id} → ${canonical._id}`);

			// Merge rankings from extra into canonical (avoid dupes by orgId)
			const extraRankings = extra.rankings ?? [];
			const canonRankings = canonical.rankings ?? [];
			const existingOrgIds = new Set(canonRankings.map((r) => r.orgId));
			const newRankings = extraRankings.filter((r) => !existingOrgIds.has(r.orgId));

			// Merge aliases
			const allAliases = [
				...new Set([
					...(canonical.aliases ?? [canonical._id]),
					...(extra.aliases ?? [extra._id]),
					extra._id
				])
			];

			// Merge nationalities (prefer the longer/more specific list)
			const canonNats = canonical.nationalities ?? [];
			const extraNats = extra.nationalities ?? [];
			const mergedNats = canonNats.length >= extraNats.length ? canonNats : extraNats;

			await fighters.updateOne(
				{ _id: canonical._id },
				{
					$set: {
						aliases: allAliases,
						...(newRankings.length && {
							rankings: [...canonRankings, ...newRankings]
						}),
						...(mergedNats.length && { nationalities: mergedNats })
					}
				}
			);

			// Delete the duplicate doc
			await fighters.deleteOne({ _id: extra._id });
			console.log(`    deleted ${extra._id}`);
		}
	}

	console.log('\nMigration complete.');
} finally {
	await client.close();
}
