import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const XML_PATH = join(process.cwd(), 'static', 'data', 'rankings.xml');

let cachedData;

const getAttribute = (text, name) => {
	const match = text.match(new RegExp(`${name}="([^"]*)"`, 'u'));
	return match?.[1] ?? '';
};

const getTagValue = (text, tagName) => {
	const match = text.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'u'));
	return decodeXml(match?.[1]?.trim() ?? '');
};

const getTagBlocks = (text, tagName) => {
	return [...text.matchAll(new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}>`, 'gu'))].map(
		(match) => match[0]
	);
};

const getSelfClosingTags = (text, tagName) => {
	return [...text.matchAll(new RegExp(`<${tagName}\\s+([^>]*)\\/>`, 'gu'))].map((match) => match[1]);
};

const decodeXml = (value) =>
	value
		.replaceAll('&apos;', "'")
		.replaceAll('&quot;', '"')
		.replaceAll('&gt;', '>')
		.replaceAll('&lt;', '<')
		.replaceAll('&amp;', '&');

const parseLimits = (weightClassBlock) =>
	[...weightClassBlock.matchAll(/<limit\s+([^>]*)>([\s\S]*?)<\/limit>/gu)].map((match) => ({
		unit: getAttribute(match[1], 'unit'),
		value: decodeXml(match[2].trim())
	}));

const parseOrganisations = (xml) =>
	getTagBlocks(xml, 'organisation').map((organisationBlock) => {
		const id = getAttribute(organisationBlock, 'id');
		const weightClassesBlock = getTagValueRaw(organisationBlock, 'weightClasses');

		return {
			id,
			name: getTagValue(organisationBlock, 'name'),
			website: getTagValue(organisationBlock, 'website'),
			weightClasses: getTagBlocks(weightClassesBlock, 'weightClass').map((weightClassBlock) => ({
				id: getAttribute(weightClassBlock, 'id'),
				organisationId: id,
				name: getTagValue(weightClassBlock, 'name'),
				limits: parseLimits(weightClassBlock)
			}))
		};
	});

const getTagValueRaw = (text, tagName) => {
	const match = text.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'u'));
	return match?.[1] ?? '';
};

const parseFighters = (xml) =>
	getTagBlocks(getTagValueRaw(xml, 'fighters'), 'fighter').map((fighterBlock) => ({
		id: getAttribute(fighterBlock, 'id'),
		name: getTagValue(fighterBlock, 'name'),
		country: getTagValue(fighterBlock, 'country'),
		age: getTagValue(fighterBlock, 'age'),
		record: getTagValue(fighterBlock, 'record')
	}));

const parseRankings = (xml) =>
	getTagBlocks(getTagValueRaw(xml, 'rankings'), 'ranking').map((rankingBlock) => ({
		organisationId: getAttribute(rankingBlock, 'organisationId'),
		weightClassId: getAttribute(rankingBlock, 'weightClassId'),
		sourceUrl: getTagValue(rankingBlock, 'sourceUrl'),
		updatedAt: getAttribute(rankingBlock, 'updatedAt'),
		entries: getSelfClosingTags(rankingBlock, 'entry').map((entryAttributes) => ({
			position: getAttribute(entryAttributes, 'position'),
			fighterId: getAttribute(entryAttributes, 'fighterId')
		}))
	}));

const buildDataModel = (xml) => {
	const organisations = parseOrganisations(xml);
	const fighters = parseFighters(xml);
	const rankings = parseRankings(xml);
	const fightersById = new Map(fighters.map((fighter) => [fighter.id, fighter]));
	const organisationsById = new Map(organisations.map((organisation) => [organisation.id, organisation]));
	const weightClassesById = new Map(
		organisations.flatMap((organisation) =>
			organisation.weightClasses.map((weightClass) => [weightClass.id, weightClass])
		)
	);

	const rankingsWithResolvedData = rankings.map((ranking) => {
		const organisation = organisationsById.get(ranking.organisationId) ?? null;
		const weightClass = weightClassesById.get(ranking.weightClassId) ?? null;

		return {
			...ranking,
			organisation,
			weightClass,
			entries: ranking.entries.map((entry) => ({
				...entry,
				fighter: fightersById.get(entry.fighterId) ?? null
			}))
		};
	});

	const errors = validateData({
		fightersById,
		organisationsById,
		weightClassesById,
		rankings: rankingsWithResolvedData
	});

	return {
		organisations,
		fighters,
		rankings: rankingsWithResolvedData,
		errors
	};
};

const validateData = ({ fightersById, organisationsById, weightClassesById, rankings }) => {
	const errors = [];

	for (const ranking of rankings) {
		if (!organisationsById.has(ranking.organisationId)) {
			errors.push(`Ranking references unknown organisation: ${ranking.organisationId}`);
		}

		const weightClass = weightClassesById.get(ranking.weightClassId);

		if (!weightClass) {
			errors.push(`Ranking references unknown weight class: ${ranking.weightClassId}`);
		} else if (weightClass.organisationId !== ranking.organisationId) {
			errors.push(
				`Ranking references weight class ${ranking.weightClassId} outside organisation ${ranking.organisationId}`
			);
		}

		for (const entry of ranking.entries) {
			if (!fightersById.has(entry.fighterId)) {
				errors.push(`Ranking entry references unknown fighter: ${entry.fighterId}`);
			}
		}
	}

	if (errors.length > 0) {
		console.error(`Ranking XML validation failed:\n${errors.join('\n')}`);
	}

	return errors;
};

export const getRankingData = async () => {
	if (!cachedData) {
		const xml = await readFile(XML_PATH, 'utf-8');
		cachedData = buildDataModel(xml);
	}

	return cachedData;
};

export const getOrganisations = async () => {
	const data = await getRankingData();
	return data.organisations;
};

export const getWeightClassesByOrganisation = async (organisationId) => {
	const organisations = await getOrganisations();
	return organisations.find((organisation) => organisation.id === organisationId)?.weightClasses ?? [];
};

export const getRankingsByOrganisationAndWeightClass = async (organisationId, weightClassId) => {
	const data = await getRankingData();

	return data.rankings.filter(
		(ranking) =>
			ranking.organisationId === organisationId && ranking.weightClassId === weightClassId
	);
};

export const getFighterById = async (fighterId) => {
	const data = await getRankingData();
	return data.fighters.find((fighter) => fighter.id === fighterId) ?? null;
};

export const getRankingEntriesByFighterId = async (fighterId) => {
	const data = await getRankingData();

	return data.rankings.flatMap((ranking) =>
		ranking.entries
			.filter((entry) => entry.fighterId === fighterId)
			.map((entry) => ({
				...entry,
				organisation: ranking.organisation,
				weightClass: ranking.weightClass,
				sourceUrl: ranking.sourceUrl,
				updatedAt: ranking.updatedAt
			}))
	);
};
