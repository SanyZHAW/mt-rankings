import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getFightersCollection, getRankingsCollection } from '$lib/server/db.js';

const WBC_XML = join(process.cwd(), 'static', 'data', 'wbc_rankings.xml');

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

// ── sync parsed XML into MongoDB ───────────────────────────────────────────────

const syncToMongo = async (xml) => {
	const fighters = parseFighters(xml);
	const rankings = parseRankings(xml);

	const fightersCol = await getFightersCollection();
	const rankingsCol = await getRankingsCollection();

	for (const fighter of fighters) {
		await fightersCol.replaceOne({ _id: fighter._id }, fighter, { upsert: true });
	}

	for (const ranking of rankings) {
		await rankingsCol.replaceOne(
			{ organisationId: ranking.organisationId, weightClassId: ranking.weightClassId },
			ranking,
			{ upsert: true }
		);
	}

	return { fighters: fighters.length, rankings: rankings.length };
};

// ── handler ────────────────────────────────────────────────────────────────────

export const POST = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorised.' }, { status: 401 });
	if (locals.user.role !== 'admin') return json({ error: 'Forbidden.' }, { status: 403 });

	// Phase 1: read the XML file committed to the repo
	let xml;
	try {
		xml = await readFile(WBC_XML, 'utf-8');
	} catch (err) {
		console.error('[scrape] Failed to read XML file:', { path: WBC_XML, message: err.message });
		return json({ error: `Failed to read XML: ${err.message}` }, { status: 500 });
	}

	// Phase 2: parse XML and upsert into MongoDB
	let counts;
	try {
		counts = await syncToMongo(xml);
	} catch (err) {
		console.error('[scrape] MongoDB sync failed:', err);
		return json({ error: `Database sync failed: ${err.message}` }, { status: 500 });
	}

	return json({
		success: true,
		updatedAt: new Date().toISOString().slice(0, 10),
		fighters: counts.fighters,
		rankings: counts.rankings
	});
};
