// ── Dedup helper ──────────────────────────────────────────────────────────────
// Used by both sync endpoints to match fighters across orgs by name.
export const normalizeForDedup = (name) =>
	name.toLowerCase().replace(/[^a-z0-9]/g, '');

// ── Low-level helpers ──────────────────────────────────────────────────────────

export const getAttribute = (text, name) => {
	const match = text.match(new RegExp(`${name}="([^"]*)"`, 'u'));
	return match?.[1] ?? '';
};

export const getTagBlocks = (text, tagName) =>
	[...text.matchAll(new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}>`, 'gu'))].map(
		(m) => m[0]
	);

export const getSelfClosingTags = (text, tagName) =>
	[...text.matchAll(new RegExp(`<${tagName}\\s+([^>]*)\\/>`, 'gu'))].map((m) => m[1]);

export const getTagValueRaw = (text, tagName) => {
	const m = text.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'u'));
	return m?.[1] ?? '';
};

export const decodeXml = (value) =>
	value
		.replaceAll('&apos;', "'")
		.replaceAll('&quot;', '"')
		.replaceAll('&gt;', '>')
		.replaceAll('&lt;', '<')
		.replaceAll('&amp;', '&');

export const getTagValue = (text, tagName) => decodeXml(getTagValueRaw(text, tagName).trim());

// ── Domain parsers ─────────────────────────────────────────────────────────────

export const parseLimits = (block) =>
	[...block.matchAll(/<limit\s+([^>]*)>([\s\S]*?)<\/limit>/gu)].map((m) => ({
		unit: getAttribute(m[1], 'unit'),
		value: decodeXml(m[2].trim())
	}));

export const parseOrganisations = (xml) =>
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

/**
 * Parses <fighter> blocks. Supports both legacy <country> and new <nationalities> format.
 *
 * Single nationality (legacy):
 *   <country>Thailand</country>  →  nationalities: ["Thailand"]
 *
 * Multiple nationalities (Step 3+):
 *   <nationalities><nationality>TH</nationality><nationality>FR</nationality></nationalities>
 *   →  nationalities: ["TH", "FR"]
 */
export const parseFighters = (xml) =>
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

export const parseRankings = (xml) =>
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
