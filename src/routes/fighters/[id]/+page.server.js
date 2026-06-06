import {
	getFighterById,
	getRankingData,
	getRankingEntriesByFighterId
} from '$lib/server/rankingsXml.js';
import { getFavoriteByUserAndFighter, toggleFavorite } from '$lib/server/favorites.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const fighter = await getFighterById(params.id);

	// params.id is a known alias — redirect to the canonical fighter URL
	if (fighter && fighter.id !== params.id) {
		throw redirect(301, `/fighters/${fighter.id}`);
	}

	const rankingData = await getRankingData();
	const favorite =
		locals.user && fighter
			? await getFavoriteByUserAndFighter({ userId: locals.user.id, fighterId: params.id })
			: null;

	// Prefer the embedded rankings array (populated during sync); fall back to
	// querying the rankings collection for fighters synced with the old schema.
	let rankings;
	if (fighter?.rankings?.length) {
		rankings = fighter.rankings;
	} else {
		const rankingEntries = fighter ? await getRankingEntriesByFighterId(params.id) : [];
		rankings = rankingEntries.map((e) => ({
			orgId: e.organisation?.id ?? null,
			org: e.organisation?.name ?? 'Unknown',
			weightClassId: e.weightClass?.id ?? '',
			weightClassName: e.weightClass?.name ?? '',
			position: e.position
		}));
	}

	return {
		fighter,
		fighterId: params.id,
		isFavorite: Boolean(favorite),
		rankings,
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

		const result = await toggleFavorite({
			userId: locals.user.id,
			fighterId: params.id
		});

		if (!result.ok) {
			return fail(400, {
				message: result.message
			});
		}

		return {
			isFavorite: result.isFavorite,
			message: result.message
		};
	}
};
