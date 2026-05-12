import { getFavoritesCollection } from './db.js';
import { getFighterById } from './rankingsXml.js';

export const getFavoriteByUserAndFighter = async ({ userId, fighterId }) => {
	const favorites = await getFavoritesCollection();
	return favorites.findOne({ userId, fighterId });
};

export const getFavoriteFighterIdsByUser = async (userId) => {
	const favorites = await getFavoritesCollection();
	const documents = await favorites.find({ userId }).sort({ createdAt: -1 }).toArray();
	return documents.map((favorite) => favorite.fighterId);
};

export const addFavorite = async ({ userId, fighterId }) => {
	const fighter = await getFighterById(fighterId);

	if (!fighter) {
		return { ok: false, message: 'Unknown fighter.' };
	}

	const favorites = await getFavoritesCollection();
	await favorites.createIndex({ userId: 1, fighterId: 1 }, { unique: true });

	await favorites.updateOne(
		{ userId, fighterId },
		{
			$setOnInsert: {
				userId,
				fighterId,
				createdAt: new Date()
			}
		},
		{ upsert: true }
	);

	return { ok: true };
};

export const getFavoriteFightersByUser = async (userId) => {
	const fighterIds = await getFavoriteFighterIdsByUser(userId);
	const fighters = await Promise.all(fighterIds.map((fighterId) => getFighterById(fighterId)));

	return fighters.filter(Boolean);
};
