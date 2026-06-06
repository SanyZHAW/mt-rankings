import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getOrganisationsCollection, getFightersCollection, getRankingsCollection } from '$lib/server/db.js';

const RWS_XML = join(process.cwd(), 'static', 'data', 'rws_rankings.xml');

// ── XML helpers ───────────────────────────────────────────────────────────────

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

// ── parsers ───────────────────────────────────────────────────────────────────

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
		const fighter = {
			_id: getAttribute(block, 'id'),
			name: getTagValue(block, 'name'),
			country: getTagValue(block, 'country')
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

// ── sync ──────────────────────────────────────────────────────────────────────

const syncToMongo = async (xml) => {
	const organisations = parseOrganisations(xml);
	const fighters = parseFighters(xml);
	const rankings = parseRankings(xml);

	const orgsCol = await getOrganisationsCollection();
	const fightersCol = await getFightersCollection();
	const rankingsCol = await getRankingsCollection();

	for (const org of organisations) {
		await orgsCol.replaceOne({ _id: org._id }, org, { upsert: true });
	}
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

// ── handler ───────────────────────────────────────────────────────────────────

export const POST = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorised.' }, { status: 401 });
	if (locals.user.role !== 'admin') return json({ error: 'Forbidden.' }, { status: 403 });

	let xml;
	try {
		xml = await readFile(RWS_XML, 'utf-8');
	} catch (err) {
		console.error('[scrape/rws] Failed to read XML file:', { path: RWS_XML, message: err.message });
		return json({ error: `Failed to read XML: ${err.message}` }, { status: 500 });
	}

	let counts;
	try {
		counts = await syncToMongo(xml);
	} catch (err) {
		console.error('[scrape/rws] MongoDB sync failed:', err);
		return json({ error: `Database sync failed: ${err.message}` }, { status: 500 });
	}

	return json({
		success: true,
		updatedAt: new Date().toISOString().slice(0, 10),
		fighters: counts.fighters,
		rankings: counts.rankings
	});
};
