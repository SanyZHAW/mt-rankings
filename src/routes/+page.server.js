import {
	getFightersCollection,
	getRankingsCollection,
	getUsersCollection,
	getFavoritesCollection
} from '$lib/server/db.js';
import { getActiveAnnouncement } from '$lib/server/announcements.js';

async function getLastSyncForOrg(col, orgId) {
	const doc = await col.findOne(
		{ organisationId: orgId },
		{ sort: { updatedAt: -1 }, projection: { updatedAt: 1 } }
	);
	return doc?.updatedAt != null ? new Date(doc.updatedAt).toISOString() : null;
}

async function getRecentFavorites(userId) {
	const [favCol, fightersCol] = await Promise.all([
		getFavoritesCollection(),
		getFightersCollection()
	]);

	const docs = await favCol.find({ userId }).sort({ createdAt: -1 }).limit(3).toArray();
	if (docs.length === 0) return [];

	const ids = docs.map((d) => d.fighterId);
	const fighterDocs = await fightersCol
		.find({ $or: [{ _id: { $in: ids } }, { aliases: { $in: ids } }] })
		.toArray();

	const byId = new Map();
	for (const f of fighterDocs) {
		byId.set(f._id, f);
		for (const alias of f.aliases ?? []) byId.set(alias, f);
	}

	return docs
		.map((d) => {
			const f = byId.get(d.fighterId);
			return f ? { id: f._id, name: f.name, country: f.country ?? '' } : null;
		})
		.filter(Boolean);
}

export const load = async ({ locals }) => {
	const announcement = await getActiveAnnouncement();

	if (!locals.user) {
		return { view: 'guest', announcement };
	}

	if (locals.user.role === 'admin') {
		const [fightersCol, rankingsCol, usersCol] = await Promise.all([
			getFightersCollection(),
			getRankingsCollection(),
			getUsersCollection()
		]);

		const [fighterCount, rankingCount, userCount, wbcLastSync, rwsLastSync, wbcFighterCount, rwsFighterCount] = await Promise.all([
			fightersCol.countDocuments(),
			rankingsCol.countDocuments(),
			usersCol.countDocuments(),
			getLastSyncForOrg(rankingsCol, 'org-wbc'),
			getLastSyncForOrg(rankingsCol, 'org-rws'),
			fightersCol.countDocuments({ _id: { $regex: /^fighter-/ } }),
			fightersCol.countDocuments({ _id: { $regex: /^rws-/ } })
		]);

		return {
			view: 'admin',
			announcement,
			fighterCount,
			rankingCount,
			userCount,
			wbcLastSync,
			rwsLastSync,
			wbcFighterCount,
			rwsFighterCount
		};
	}

	// Regular user
	const [recentFavorites, rankingsCol] = await Promise.all([
		getRecentFavorites(locals.user.id),
		getRankingsCollection()
	]);

	const lastSyncDoc = await rankingsCol.findOne(
		{},
		{ sort: { updatedAt: -1 }, projection: { updatedAt: 1 } }
	);

	return {
		view: 'user',
		announcement,
		user: locals.user,
		recentFavorites,
		lastSync: lastSyncDoc?.updatedAt != null ? new Date(lastSyncDoc.updatedAt).toISOString() : null
	};
};
