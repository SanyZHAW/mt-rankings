import { getPoundForPoundCollection, getFightersCollection } from './db.js';

const DOC_ID = 'p4p-world';

// Resolve flag emoji from ISO code or country name
function flag(code) {
	if (!code || code.length < 2) return '';
	return [...code.toUpperCase().slice(0, 2)]
		.map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
		.join('');
}

function flagsFor(f) {
	const nats = f.nationalities?.length ? f.nationalities : f.country ? [f.country] : [];
	return nats.map(flag).filter(Boolean).join(' ');
}

export async function getP4P() {
	const col = await getPoundForPoundCollection();
	const doc = await col.findOne({ _id: DOC_ID });
	if (!doc || !doc.entries?.length) return { entries: [], updatedAt: null, updatedBy: null };

	// Hydrate fighter data for each entry
	const fighterIds = doc.entries.map((e) => e.fighterId).filter(Boolean);
	const fightersCol = await getFightersCollection();
	const fighterDocs = await fightersCol
		.find({ $or: [{ _id: { $in: fighterIds } }, { aliases: { $in: fighterIds } }] })
		.toArray();

	const byId = new Map();
	for (const f of fighterDocs) {
		const obj = { id: f._id, name: f.name, country: f.country, nationalities: f.nationalities ?? [], rankings: f.rankings ?? [] };
		byId.set(f._id, obj);
		for (const alias of f.aliases ?? []) byId.set(alias, obj);
	}

	const entries = doc.entries
		.map((e) => {
			const fighter = byId.get(e.fighterId) ?? null;
			if (!fighter) return null;
			return {
				position: e.position,
				fighterId: e.fighterId,
				note: e.note ?? '',
				fighter: {
					...fighter,
					flags: flagsFor(fighter),
					orgs: fighter.rankings.map((r) => r.org).filter(Boolean)
				}
			};
		})
		.filter(Boolean)
		.sort((a, b) => a.position - b.position);

	return {
		entries,
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
		updatedBy: doc.updatedBy ?? null
	};
}

export async function upsertP4P({ entries, updatedBy }) {
	const col = await getPoundForPoundCollection();
	const cleaned = entries
		.filter((e) => e.fighterId)
		.slice(0, 10)
		.map((e, i) => ({
			position: i + 1,
			fighterId: e.fighterId,
			note: e.note?.trim() ?? ''
		}));

	await col.updateOne(
		{ _id: DOC_ID },
		{ $set: { entries: cleaned, updatedAt: new Date(), updatedBy } },
		{ upsert: true }
	);
}
