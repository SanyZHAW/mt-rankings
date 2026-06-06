import {
	getOrganisations,
	getRankingsByOrganisationAndWeightClass,
	getRankingData,
	getWeightClassesByOrganisation
} from '$lib/server/rankingsXml.js';
import { getP4P } from '$lib/server/p4p.js';

export const load = async ({ url }) => {
	const tab = url.searchParams.get('tab') ?? '';
	const selectedOrganisationId = url.searchParams.get('organisation') ?? '';
	const selectedWeightClassId = url.searchParams.get('weightClass') ?? '';

	const organisations = await getOrganisations();

	// P4P tab — skip org/weight-class loading
	if (tab === 'p4p') {
		const p4p = await getP4P();
		return {
			tab: 'p4p',
			p4p,
			organisations,
			weightClasses: [],
			rankings: [],
			selectedOrganisationId: '',
			selectedWeightClassId: '',
			validationErrors: []
		};
	}

	const weightClasses = selectedOrganisationId
		? await getWeightClassesByOrganisation(selectedOrganisationId)
		: [];
	const rankings =
		selectedOrganisationId && selectedWeightClassId
			? await getRankingsByOrganisationAndWeightClass(selectedOrganisationId, selectedWeightClassId)
			: [];
	const rankingData = await getRankingData();

	return {
		tab: '',
		p4p: null,
		organisations,
		weightClasses,
		rankings,
		selectedOrganisationId,
		selectedWeightClassId,
		validationErrors: rankingData.errors
	};
};
