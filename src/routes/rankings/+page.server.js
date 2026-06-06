import {
	getOrganisations,
	getRankingsByOrganisationAndWeightClass,
	getRankingData,
	getWeightClassesByOrganisation
} from '$lib/server/rankingsXml.js';

export const load = async ({ url }) => {
	const selectedOrganisationId = url.searchParams.get('organisation') ?? '';
	const selectedWeightClassId = url.searchParams.get('weightClass') ?? '';
	const organisations = await getOrganisations();
	const weightClasses = selectedOrganisationId
		? await getWeightClassesByOrganisation(selectedOrganisationId)
		: [];
	const rankings =
		selectedOrganisationId && selectedWeightClassId
			? await getRankingsByOrganisationAndWeightClass(selectedOrganisationId, selectedWeightClassId)
			: [];
	const rankingData = await getRankingData();

	const result = {
		organisations,
		weightClasses,
		rankings,
		selectedOrganisationId,
		selectedWeightClassId,
		validationErrors: rankingData.errors
	};
	console.log('[rankings/load]', {
		orgCount: organisations.length,
		orgs: organisations.map((o) => ({ id: o.id, name: o.name, wcCount: o.weightClasses?.length })),
		wcCount: weightClasses.length,
		rankingsCount: rankings.length,
		selectedOrganisationId,
		selectedWeightClassId
	});
	return result;
};
