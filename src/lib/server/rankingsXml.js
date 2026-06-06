import {
	getOrganisationsCollection,
	getFightersCollection,
	getRankingsCollection
} from './db.js';

// ── organisations / weight classes from MongoDB ────────────────────────────────

const loadOrgs = async () => {
	const col = await getOrganisationsCollection();
	const docs = await col.find({}).toArray();
	return docs.map((doc) => ({
		id: doc._id,
		name: doc.name,
		website: doc.website,
		weightClasses: (doc.weightClasses ?? []).map((wc) => ({
			id: wc.id,
			organisationId: doc._id,
			name: wc.name,
			limits: wc.limits
		}))
	}));
};

// ── exported functions ─────────────────────────────────────────────────────────

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
	// Search by canonical _id first, then by any known alias
	const doc = await col.findOne({ $or: [{ _id: fighterId }, { aliases: fighterId }] });
	if (!doc) return null;
	return {
		id: doc._id,
		name: doc.name,
		country: doc.country,
		nationalities: doc.nationalities ?? [],
		rankings: doc.rankings ?? []
	};
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

	// Also match documents where one of the fighter IDs is stored as an alias
	const fighterDocs = await fightersCol
		.find({ $or: [{ _id: { $in: fighterIds } }, { aliases: { $in: fighterIds } }] })
		.toArray();

	// Build lookup that covers both canonical _id and all aliases
	const fightersById = new Map();
	for (const f of fighterDocs) {
		const fighter = { id: f._id, name: f.name, country: f.country };
		fightersById.set(f._id, fighter);
		for (const alias of f.aliases ?? []) {
			fightersById.set(alias, fighter);
		}
	}

	return docs.map((doc) => ({
		organisationId: doc.organisationId,
		weightClassId: doc.weightClassId,
		sourceUrl: doc.sourceUrl,
		updatedAt: doc.updatedAt,
		organisation: orgsById.get(doc.organisationId) ?? null,
		weightClass: weightClassesById.get(doc.weightClassId) ?? null,
		entries: doc.entries
			.map((e) => ({ ...e, fighter: fightersById.get(e.fighterId) ?? null }))
			.filter((e) => e.fighter !== null)
	}));
};

export const getRankingEntriesByFighterId = async (fighterId) => {
	const orgs = await loadOrgs();
	const orgsById = new Map(orgs.map((o) => [o.id, o]));
	const weightClassesById = new Map(orgs.flatMap((o) => o.weightClasses.map((wc) => [wc.id, wc])));

	const fightersCol = await getFightersCollection();
	const fighterDoc = await fightersCol.findOne({
		$or: [{ _id: fighterId }, { aliases: fighterId }]
	});

	// Collect all IDs this fighter is known under (own _id + all aliases)
	const allIds = fighterDoc
		? [fighterDoc._id, ...(fighterDoc.aliases ?? [])]
		: [fighterId];

	const rankingsCol = await getRankingsCollection();
	const docs = await rankingsCol
		.find({ 'entries.fighterId': { $in: allIds } })
		.toArray();

	return docs.flatMap((doc) =>
		doc.entries
			.filter((e) => allIds.includes(e.fighterId))
			.map((e) => ({
				...e,
				organisation: orgsById.get(doc.organisationId) ?? null,
				weightClass: weightClassesById.get(doc.weightClassId) ?? null,
				sourceUrl: doc.sourceUrl,
				updatedAt: doc.updatedAt
			}))
	);
};
