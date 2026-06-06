/**
 * One-time seed: reads static/data/rankings.xml and upserts fighters + rankings into MongoDB.
 * Run: node --env-file=.env scripts/seed-rankings.js
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MongoClient } from 'mongodb';

const DB_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME || 'mt-rankings';
const XML_PATH = join(process.cwd(), 'static', 'data', 'rankings.xml');

// ── XML helpers ────────────────────────────────────────────────────────────────

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

// ── parsers ────────────────────────────────────────────────────────────────────

const parseFighters = (xml) =>
	getTagBlocks(getTagValueRaw(xml, 'fighters'), 'fighter').map((block) => ({
		_id: getAttribute(block, 'id'),
		name: getTagValue(block, 'name'),
		country: getTagValue(block, 'country')
	}));

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

// ── main ───────────────────────────────────────────────────────────────────────

const seed = async () => {
	if (!DB_URI) {
		throw new Error('DB_URI is not set. Run with: node --env-file=.env scripts/seed-rankings.js');
	}

	const xml = await readFile(XML_PATH, 'utf-8');
	const fighters = parseFighters(xml);
	const rankings = parseRankings(xml);

	console.log(`Parsed ${fighters.length} fighters and ${rankings.length} rankings from XML.`);

	const client = new MongoClient(DB_URI);
	await client.connect();
	const db = client.db(DB_NAME);

	const fightersCol = db.collection('fighters');
	const rankingsCol = db.collection('rankings');

	let fightersUpserted = 0;
	for (const fighter of fighters) {
		await fightersCol.replaceOne({ _id: fighter._id }, fighter, { upsert: true });
		fightersUpserted++;
	}
	console.log(`Upserted ${fightersUpserted} fighters.`);

	let rankingsUpserted = 0;
	for (const ranking of rankings) {
		await rankingsCol.replaceOne(
			{ organisationId: ranking.organisationId, weightClassId: ranking.weightClassId },
			ranking,
			{ upsert: true }
		);
		rankingsUpserted++;
	}
	console.log(`Upserted ${rankingsUpserted} rankings.`);

	await client.close();
	console.log('Done. Run the app — it will now read fighters and rankings from MongoDB.');
};

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
