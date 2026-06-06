/**
 * Standalone sync script — runs both WBC and RWS syncs directly against MongoDB.
 * Same logic as the +server.js endpoints; no HTTP layer, no auth required.
 * Usage: node scripts/sync-direct.mjs
 */

import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ── load .env ─────────────────────────────────────────────────────────────────

const env = Object.fromEntries(
	readFileSync(join(root, '.env'), 'utf-8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
		.map((l) => {
			const idx = l.indexOf('=');
			return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
		})
);

const DB_URI = env.DB_URI;
const DB_NAME = env.DB_NAME || 'mt-rankings';

if (!DB_URI || DB_URI === 'your-mongodb-connection-string') {
	console.error('ERROR: DB_URI not set in .env');
	process.exit(1);
}

// ── XML parser (inlined from src/lib/server/xmlParser.js) ─────────────────────

const normalizeForDedup = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const getAttribute = (text, name) => {
	const match = text.match(new RegExp(`${name}="([^"]*)"`, 'u'));
	return match?.[1] ?? '';
};

const getTagBlocks = (text, tagName) =>
	[...text.matchAll(new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}>`, 'gu'))].map(
		(m) => m[0]
	);

const getSelfClosingTags = (text, tagName) =>
	[...text.matchAll(new RegExp(`<${tagName}\\s+([^>]*)\\/>`, 'gu'))].map((m) => m[1]);

const getTagValueRaw = (text, tagName) => {
	const m = text.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'u'));
	return m?.[1] ?? '';
};

const decodeXml = (value) =>
	value
		.replaceAll('&apos;', "'")
		.replaceAll('&quot;', '"')
		.replaceAll('&gt;', '>')
		.replaceAll('&lt;', '<')
		.replaceAll('&amp;', '&');

const getTagValue = (text, tagName) => decodeXml(getTagValueRaw(text, tagName).trim());

const parseLimits = (block) =>
	[...block.matchAll(/<limit\s+([^>]*)>([\s\S]*?)<\/limit>/gu)].map((m) => ({
		unit: getAttribute(m[1], 'unit'),
		value: decodeXml(m[2].trim())
	}));

const parseOrganisations = (xml) =>
	getTagBlocks(getTagValueRaw(xml, 'organisations'), 'organisation').map((block) => {
		const id = getAttribute(block, 'id');
		const wcBlock = getTagValueRaw(block, 'weightClasses');
		return {
			_id: id,
			name: getTagValue(block, 'name'),
			website: getTagValue(block, 'website'),
			weightClasses: getTagBlocks(wcBlock, 'weightClass').map((wc) => ({
				id: getAttribute(wc, 'id'),
				name: getTagValue(wc, 'name'),
				limits: parseLimits(wc)
			}))
		};
	});

const parseFighters = (xml) =>
	getTagBlocks(getTagValueRaw(xml, 'fighters'), 'fighter').map((block) => {
		const country = getTagValue(block, 'country');
		const natsRaw = getTagValueRaw(block, 'nationalities');
		let nationalities;
		if (natsRaw) {
			const items = [...natsRaw.matchAll(/<nationality>([\s\S]*?)<\/nationality>/gu)]
				.map((m) => decodeXml(m[1].trim()))
				.filter(Boolean);
			nationalities = items.length > 0 ? items : country ? [country] : [];
		} else {
			nationalities = country ? [country] : [];
		}
		const fighter = {
			_id: getAttribute(block, 'id'),
			name: getTagValue(block, 'name'),
			country,
			nationalities
		};
		const age = getTagValue(block, 'age');
		const record = getTagValue(block, 'record');
		if (age) fighter.age = Number(age) || age;
		if (record) fighter.record = record;
		return fighter;
	});

const parseRankings = (xml) =>
	getTagBlocks(getTagValueRaw(xml, 'rankings'), 'ranking').map((block) => ({
		organisationId: getAttribute(block, 'organisationId'),
		weightClassId: getAttribute(block, 'weightClassId'),
		updatedAt: getAttribute(block, 'updatedAt'),
		sourceUrl: getTagValue(block, 'sourceUrl'),
		entries: getSelfClosingTags(block, 'entry').map((attrs) => ({
			position: getAttribute(attrs, 'position'),
			fighterId: getAttribute(attrs, 'fighterId')
		}))
	}));

// ── sync core (same as +server.js) ───────────────────────────────────────────

const syncToMongo = async (xml, db, label) => {
	const organisations = parseOrganisations(xml);
	const fighters = parseFighters(xml);
	const rankings = parseRankings(xml);

	console.log(`[${label}] parsed: ${organisations.length} org(s), ${fighters.length} fighter(s), ${rankings.length} ranking(s)`);

	const orgsCol = db.collection('organisations');
	const fightersCol = db.collection('fighters');
	const rankingsCol = db.collection('rankings');

	for (const org of organisations) {
		await orgsCol.replaceOne({ _id: org._id }, org, { upsert: true });
	}

	const idMap = new Map();
	let dedupMatches = 0;
	let newInserts = 0;

	for (const fighter of fighters) {
		const normalized = normalizeForDedup(fighter.name);
		const existing = await fightersCol.findOne({
			$or: [{ _id: fighter._id }, { normalizedName: normalized }, { aliases: fighter._id }]
		});

		if (existing) {
			dedupMatches++;
			idMap.set(fighter._id, existing._id);
			await fightersCol.updateOne(
				{ _id: existing._id },
				{
					$addToSet: { aliases: fighter._id },
					$set: {
						normalizedName: normalizeForDedup(existing.name),
						...(fighter.nationalities?.length && { nationalities: fighter.nationalities }),
						...(fighter.age != null && { age: fighter.age }),
						...(fighter.record && { record: fighter.record })
					}
				}
			);
			if (existing._id !== fighter._id) {
				console.log(`  [dedup] ${fighter._id} → canonical: ${existing._id}`);
			}
		} else {
			newInserts++;
			idMap.set(fighter._id, fighter._id);
			await fightersCol.replaceOne(
				{ _id: fighter._id },
				{ ...fighter, normalizedName: normalized, aliases: [fighter._id] },
				{ upsert: true }
			);
		}
	}

	console.log(`[${label}] fighters: ${dedupMatches} matched (updated), ${newInserts} new`);

	for (const ranking of rankings) {
		await rankingsCol.replaceOne(
			{ organisationId: ranking.organisationId, weightClassId: ranking.weightClassId },
			ranking,
			{ upsert: true }
		);
	}

	const org = organisations[0];
	const orgId = org?._id;
	const orgName = org?.name ?? orgId ?? '';
	const wcByClassId = new Map(
		organisations.flatMap((o) => o.weightClasses.map((wc) => [wc.id, wc.name]))
	);

	const fighterRankingsMap = new Map();
	for (const ranking of rankings) {
		const weightClassName = wcByClassId.get(ranking.weightClassId) ?? '';
		for (const entry of ranking.entries) {
			const canonicalId = idMap.get(entry.fighterId) ?? entry.fighterId;
			if (!fighterRankingsMap.has(canonicalId)) fighterRankingsMap.set(canonicalId, []);
			fighterRankingsMap.get(canonicalId).push({
				orgId,
				org: orgName,
				weightClassId: ranking.weightClassId,
				weightClassName,
				position: entry.position
			});
		}
	}

	if (orgId) {
		const pullResult = await fightersCol.updateMany({}, { $pull: { rankings: { orgId } } });
		console.log(`[${label}] $pull ${orgId}: ${pullResult.modifiedCount} doc(s) cleared`);
	}

	for (const [canonicalId, entries] of fighterRankingsMap) {
		await fightersCol.updateOne(
			{ _id: canonicalId },
			{ $addToSet: { rankings: { $each: entries } } }
		);
	}
	console.log(`[${label}] embedded rankings on ${fighterRankingsMap.size} fighter(s)`);
};

// ── main ──────────────────────────────────────────────────────────────────────

const client = new MongoClient(DB_URI);

try {
	await client.connect();
	console.log('Connected to MongoDB:', DB_NAME);
	const db = client.db(DB_NAME);

	// WBC
	const wbcXml = await readFile(join(root, 'static', 'data', 'wbc_rankings.xml'), 'utf-8');
	await syncToMongo(wbcXml, db, 'WBC');

	// RWS
	const rwsXml = await readFile(join(root, 'static', 'data', 'rws_rankings.xml'), 'utf-8');
	await syncToMongo(rwsXml, db, 'RWS');

	console.log('\nSync complete.');
} finally {
	await client.close();
}
