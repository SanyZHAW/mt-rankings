import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getFightersCollection, getRankingsCollection } from './db.js';

const XML_PATH = join(process.cwd(), 'static', 'data', 'rankings.xml');

// ── XML helpers (organisations / weight classes only) ─────────────────────────

const getAttribute = (text, name) => {
	const match = text.match(new RegExp(`${name}="([^"]*)"`, 'u'));
	return match?.[1] ?? '';
};

const getTagBlocks = (text, tagName) =>
	[...text.matchAll(new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}>`, 'gu'))].map(
		(m) => m[0]
	);

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

const parseLimits = (weightClassBlock) =>
	[...weightClassBlock.matchAll(/<limit\s+([^>]*)>([\s\S]*?)<\/limit>/gu)].map((match) => ({
		unit: getAttribute(match[1], 'unit'),
		value: decodeXml(match[2].trim())
	}));

const parseOrganisations = (xml) =>
	getTagBlocks(xml, 'organisation').map((block) => {
		const id = getAttribute(block, 'id');
		const wcBlock = getTagValueRaw(block, 'weightClasses');
		return {
			id,
			name: getTagValue(block, 'name'),
			website: getTagValue(block, 'website'),
			weightClasses: getTagBlocks(wcBlock, 'weightClass').map((wc) => ({
				id: getAttribute(wc, 'id'),
				organisationId: id,
				name: getTagValue(wc, 'name'),
				limits: parseLimits(wc)
			}))
		};
	});

// Cache organisations — they're static config, no need to re-read the file every request.
let cachedOrgs;

const loadOrgs = async () => {
	if (!cachedOrgs) {
		const xml = await readFile(XML_PATH, 'utf-8');
		cachedOrgs = parseOrganisations(xml);
	}
	return cachedOrgs;
};

// ── exported functions (same signatures as before) ────────────────────────────

export const getRankingData = async () => {
	const organisations = await loadOrgs();
	return { organisations, errors: [] };
};

export const getOrganisations = loadOrgs;

export const getWeightClassesByOrganisation = async (organisationId) => {
	const orgs = await loadOrgs();
	return orgs.find((o) => o.id === organisationId)?.weightClasses ?? [];
};

export const getFighterById = async (fighterId) => {
	const col = await getFightersCollection();
	const doc = await col.findOne({ _id: fighterId });
	if (!doc) return null;
	return { id: doc._id, name: doc.name, country: doc.country };
};

export const getRankingsByOrganisationAndWeightClass = async (organisationId, weightClassId) => {
	const orgs = await loadOrgs();
	const orgsById = new Map(orgs.map((o) => [o.id, o]));
	const weightClassesById = new Map(orgs.flatMap((o) => o.weightClasses.map((wc) => [wc.id, wc])));

	const rankingsCol = await getRankingsCollection();
	const docs = await rankingsCol.find({ organisationId, weightClassId }).toArray();
	if (docs.length === 0) return [];

	const fighterIds = [...new Set(docs.flatMap((d) => d.entries.map((e) => e.fighterId)))];
	const fightersCol = await getFightersCollection();
	const fighterDocs = await fightersCol.find({ _id: { $in: fighterIds } }).toArray();
	const fightersById = new Map(
		fighterDocs.map((f) => [f._id, { id: f._id, name: f.name, country: f.country }])
	);

	return docs.map((doc) => ({
		organisationId: doc.organisationId,
		weightClassId: doc.weightClassId,
		sourceUrl: doc.sourceUrl,
		updatedAt: doc.updatedAt,
		organisation: orgsById.get(doc.organisationId) ?? null,
		weightClass: weightClassesById.get(doc.weightClassId) ?? null,
		entries: doc.entries.map((e) => ({ ...e, fighter: fightersById.get(e.fighterId) ?? null }))
	}));
};

export const getRankingEntriesByFighterId = async (fighterId) => {
	const orgs = await loadOrgs();
	const orgsById = new Map(orgs.map((o) => [o.id, o]));
	const weightClassesById = new Map(orgs.flatMap((o) => o.weightClasses.map((wc) => [wc.id, wc])));

	const rankingsCol = await getRankingsCollection();
	const docs = await rankingsCol.find({ 'entries.fighterId': fighterId }).toArray();

	return docs.flatMap((doc) =>
		doc.entries
			.filter((e) => e.fighterId === fighterId)
			.map((e) => ({
				...e,
				organisation: orgsById.get(doc.organisationId) ?? null,
				weightClass: weightClassesById.get(doc.weightClassId) ?? null,
				sourceUrl: doc.sourceUrl,
				updatedAt: doc.updatedAt
			}))
	);
};
