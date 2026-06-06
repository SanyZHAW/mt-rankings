import { json } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { getFightersCollection, getRankingsCollection } from '$lib/server/db.js';

const execFileAsync = promisify(execFile);

// Override via PYTHON_BIN in .env if python3 is not on PATH (e.g. Windows)
const PYTHON = process.env.PYTHON_BIN ?? 'python3';
const SCRIPT = join(process.cwd(), 'static', 'scripts', 'scrape_wbc.py');
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

	try {
		await execFileAsync(PYTHON, [SCRIPT], {
			timeout: 120_000,
			env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
		});

		const xml = await readFile(WBC_XML, 'utf-8');
		const { fighters, rankings } = await syncToMongo(xml);

		return json({
			success: true,
			updatedAt: new Date().toISOString().slice(0, 10),
			fighters,
			rankings
		});
	} catch (err) {
		const message = (err.stderr || err.message || 'Unknown error').trim();
		console.error('WBC scrape failed:', message);
		return json({ error: message }, { status: 500 });
	}
};
