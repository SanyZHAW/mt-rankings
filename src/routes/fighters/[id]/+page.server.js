import {
	getFighterById,
	getRankingData,
	getRankingEntriesByFighterId
} from '$lib/server/rankingsXml.js';

export const load = async ({ params }) => {
	const fighter = await getFighterById(params.id);
	const rankingEntries = fighter ? await getRankingEntriesByFighterId(params.id) : [];
	const rankingData = await getRankingData();

	return {
		fighter,
		fighterId: params.id,
		rankingEntries,
		validationErrors: rankingData.errors
	};
};
