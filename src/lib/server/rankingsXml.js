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
