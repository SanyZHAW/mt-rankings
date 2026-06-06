<script>
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RankingList from '$lib/components/RankingList.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data } = $props();

	// Active org: URL param takes priority, otherwise default to first org
	const activeOrg = $derived(
		data.organisations.find((o) => o.id === data.selectedOrganisationId) ??
			data.organisations[0] ??
			null
	);

	// Weight classes come from the org's embedded array — available immediately
	const weightClasses = $derived(activeOrg?.weightClasses ?? []);

	// Active weight class: URL param if valid, otherwise first in list
	const activeWcId = $derived(
		weightClasses.some((wc) => wc.id === data.selectedWeightClassId)
			? data.selectedWeightClassId
			: (weightClasses[0]?.id ?? '')
	);

	const selectedRanking = $derived(data.rankings[0] ?? null);

	// Auto-navigate to first org+wc when landing with no URL params
	$effect(() => {
		if (!data.selectedOrganisationId && activeOrg && weightClasses.length > 0) {
			goto(`/rankings?organisation=${activeOrg.id}&weightClass=${weightClasses[0].id}`, {
				replaceState: true
			});
		}
	});

	function switchOrg(org) {
		if (org.id === activeOrg?.id) return;
		// Try to match current weight class by name in the new org
		const currentWcName = weightClasses.find((wc) => wc.id === activeWcId)?.name;
		const match = org.weightClasses.find((wc) => wc.name === currentWcName);
		const wcId = match?.id ?? org.weightClasses[0]?.id ?? '';
		goto(`/rankings?organisation=${org.id}${wcId ? `&weightClass=${wcId}` : ''}`);
	}

	function switchWeightClass(e) {
		const wcId = e.currentTarget.value;
		if (!activeOrg || !wcId) return;
		goto(`/rankings?organisation=${activeOrg.id}&weightClass=${wcId}`);
	}
</script>

<section class="rankings-page">
	<PageHeader
		title="Rankings"
		subtitle="Compare Muay Thai rankings across organisations and weight classes."
	/>

	{#if data.validationErrors.length > 0}
		<StatusMessage
			type="error"
			message="The XML ranking data contains invalid references. Please check the parser output."
		/>
	{/if}

	{#if data.organisations.length > 0}
		<!-- ── Organisation tabs ── -->
		<nav class="org-tabs" aria-label="Organisation">
			{#each data.organisations as org}
				<button
					type="button"
					class="org-tab"
					class:active={org.id === activeOrg?.id}
					onclick={() => switchOrg(org)}
					aria-pressed={org.id === activeOrg?.id}
				>{org.name}</button>
			{/each}
		</nav>

		<!-- ── Weight class dropdown ── -->
		{#if weightClasses.length > 0}
			<div class="wc-row">
				<label for="weightClass" class="wc-label">Weight class</label>
				<select
					id="weightClass"
					class="wc-select"
					value={activeWcId}
					onchange={switchWeightClass}
				>
					{#each weightClasses as wc}
						<option value={wc.id}>{wc.name}</option>
					{/each}
				</select>
			</div>
		{:else}
			<StatusMessage
				type="warning"
				message="No weight classes available for this organisation."
			/>
		{/if}
	{/if}

	<!-- ── Ranking list ── -->
	{#if selectedRanking}
		<RankingList ranking={selectedRanking} />
	{:else if data.selectedOrganisationId && data.selectedWeightClassId}
		<StatusMessage
			type="warning"
			message="No ranking entries found for this weight class."
		/>
	{/if}
</section>

<style>
	.rankings-page {
		display: grid;
		gap: 1.5rem;
		max-width: 1100px;
	}

	/* ── Organisation tabs ── */
	.org-tabs {
		border-bottom: 2px solid #2b2415;
		display: flex;
		gap: 0;
	}

	.org-tab {
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		color: #bdb4a1;
		cursor: pointer;
		font: inherit;
		font-size: 0.95rem;
		margin-bottom: -2px;
		padding: 0.6rem 1.4rem;
		transition: color 0.15s ease;
		white-space: nowrap;
	}

	.org-tab:hover {
		color: #f4efe4;
	}

	.org-tab.active {
		border-bottom-color: #d6a33d;
		color: #d6a33d;
		font-weight: 700;
	}

	/* ── Weight class selector ── */
	.wc-row {
		align-items: center;
		display: flex;
		gap: 0.75rem;
	}

	.wc-label {
		color: #d6a33d;
		font-size: 0.9rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.wc-select {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		border-radius: 8px;
		color: #f4efe4;
		flex: 1;
		font: inherit;
		max-width: 340px;
		min-height: 2.75rem;
		padding: 0.6rem 0.75rem;
	}

	.wc-select:focus {
		border-color: #d6a33d;
		outline: none;
	}

	@media (max-width: 600px) {
		.org-tab {
			font-size: 0.82rem;
			padding: 0.5rem 0.85rem;
		}

		.wc-row {
			align-items: flex-start;
			flex-direction: column;
		}

		.wc-select {
			max-width: 100%;
			width: 100%;
		}
	}
</style>
