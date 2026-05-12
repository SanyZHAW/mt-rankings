<script>
	import OrganisationSelector from '$lib/components/OrganisationSelector.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RankingList from '$lib/components/RankingList.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';
	import WeightClassSelector from '$lib/components/WeightClassSelector.svelte';

	let { data } = $props();

	const selectedOrganisation = $derived(
		data.organisations.find((organisation) => organisation.id === data.selectedOrganisationId)
	);
	const selectedWeightClass = $derived(
		data.weightClasses.find((weightClass) => weightClass.id === data.selectedWeightClassId)
	);
	const hasSelectedOrganisation = $derived(Boolean(data.selectedOrganisationId));
	const hasSelectedWeightClass = $derived(Boolean(data.selectedWeightClassId));
	const selectedRanking = $derived(data.rankings[0] ?? null);
</script>

<section class="rankings-page">
	<PageHeader
		title="Rankings"
		subtitle="Select an organisation first, then choose one of its weight classes."
	/>

	{#if data.validationErrors.length > 0}
		<StatusMessage
			type="error"
			message="The XML ranking data contains invalid references. Please check the parser output."
		/>
	{/if}

	<div class="selectors">
		<OrganisationSelector
			organisations={data.organisations}
			selectedOrganisationId={data.selectedOrganisationId}
		/>

		{#if hasSelectedOrganisation}
			<WeightClassSelector
				organisationId={data.selectedOrganisationId}
				weightClasses={data.weightClasses}
				selectedWeightClassId={data.selectedWeightClassId}
			/>
		{:else}
			<StatusMessage type="info" message="Choose an organisation to see its weight classes." />
		{/if}
	</div>

	{#if hasSelectedOrganisation && data.weightClasses.length === 0}
		<StatusMessage type="warning" message="No weight classes are available for this organisation." />
	{/if}

	{#if hasSelectedOrganisation && hasSelectedWeightClass && selectedRanking}
		<RankingList ranking={selectedRanking} />
	{:else if hasSelectedOrganisation && hasSelectedWeightClass}
		<StatusMessage
			type="warning"
			message="No ranking entries were found for this organisation and weight class."
		/>
	{:else if selectedOrganisation && !hasSelectedWeightClass}
		<StatusMessage
			type="info"
			message={`Select a ${selectedOrganisation.name} weight class to show the ranking list.`}
		/>
	{/if}
</section>

<style>
	.rankings-page {
		display: grid;
		gap: 1.5rem;
		max-width: 1100px;
	}

	.selectors {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 760px) {
		.selectors {
			grid-template-columns: 1fr;
		}
	}
</style>
