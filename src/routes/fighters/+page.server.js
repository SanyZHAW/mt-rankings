import { getFightersCollection, getOrganisationsCollection } from '$lib/server/db.js';

export const load = async () => {
	const [fighterDocs, orgDocs] = await Promise.all([
		getFightersCollection().then((col) => col.find({}).sort({ name: 1 }).toArray()),
		getOrganisationsCollection().then((col) => col.find({}).toArray())
	]);

	return {
		fighters: fighterDocs.map((f) => ({
			id: f._id,
			name: f.name,
			country: f.country ?? '',
			nationalities: f.nationalities ?? [],
			rankings: f.rankings ?? []
		})),
		organisations: orgDocs.map((o) => ({
			id: o._id,
			name: o.name,
			weightClasses: (o.weightClasses ?? []).map((wc) => ({ id: wc.id, name: wc.name }))
		}))
	};
};
