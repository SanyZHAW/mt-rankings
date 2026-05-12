import {
	getFighterById,
	getRankingData,
	getRankingEntriesByFighterId
} from '$lib/server/rankingsXml.js';
import { addFavorite, getFavoriteByUserAndFighter } from '$lib/server/favorites.js';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const fighter = await getFighterById(params.id);
	const rankingEntries = fighter ? await getRankingEntriesByFighterId(params.id) : [];
	const rankingData = await getRankingData();
	const favorite = locals.user && fighter
		? await getFavoriteByUserAndFighter({ userId: locals.user.id, fighterId: params.id })
		: null;

	return {
		fighter,
		fighterId: params.id,
		isFavorite: Boolean(favorite),
		rankingEntries,
		user: locals.user,
		validationErrors: rankingData.errors
	};
};

export const actions = {
	favorite: async ({ locals, params }) => {
		if (!locals.user) {
			return fail(401, {
				message: 'Log in to save favorites.'
			});
		}

		const result = await addFavorite({
			userId: locals.user.id,
			fighterId: params.id
		});

		if (!result.ok) {
			return fail(400, {
				message: result.message
			});
		}

		return {
			message: 'Fighter saved to favorites.'
		};
	}
};
