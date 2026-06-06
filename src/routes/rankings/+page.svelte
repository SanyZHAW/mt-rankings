<script>
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RankingList from '$lib/components/RankingList.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data } = $props();

	const isP4P = $derived(data.tab === 'p4p');

	// Active org for WBC/RWS tabs
	const activeOrg = $derived(
		data.organisations.find((o) => o.id === data.selectedOrganisationId) ??
			data.organisations[0] ??
			null
	);

	const weightClasses = $derived(activeOrg?.weightClasses ?? []);

	const activeWcId = $derived(
		weightClasses.some((wc) => wc.id === data.selectedWeightClassId)
			? data.selectedWeightClassId
			: (weightClasses[0]?.id ?? '')
	);

	const selectedRanking = $derived(data.rankings[0] ?? null);

	// Auto-navigate to first org+wc when landing with no URL params (non-P4P)
	$effect(() => {
		if (!isP4P && !data.selectedOrganisationId && activeOrg && weightClasses.length > 0) {
			goto(`/rankings?organisation=${activeOrg.id}&weightClass=${weightClasses[0].id}`, {
				replaceState: true
			});
		}
	});

	function switchOrg(org) {
		if (org.id === activeOrg?.id) return;
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

	function switchToP4P() {
		goto('/rankings?tab=p4p');
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

	<!-- ── Tabs ── -->
	<nav class="org-tabs" aria-label="Organisation">
		<button
			type="button"
			class="org-tab"
			class:active={isP4P}
			onclick={switchToP4P}
			aria-pressed={isP4P}
		>P4P World</button>
		{#each data.organisations as org}
			<button
				type="button"
				class="org-tab"
				class:active={!isP4P && org.id === activeOrg?.id}
				onclick={() => switchOrg(org)}
				aria-pressed={!isP4P && org.id === activeOrg?.id}
			>{org.name}</button>
		{/each}
	</nav>

	<!-- ── P4P content ── -->
	{#if isP4P}
		<div class="p4p-section">
			<div class="p4p-heading">
				<div>
					<p class="p4p-eyebrow">Pound for Pound</p>
					<h2 class="p4p-title">MT World Ranking</h2>
				</div>
				{#if data.p4p?.updatedAt}
					<p class="p4p-meta">
						Updated {new Date(data.p4p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
						{#if data.p4p.updatedBy}· by {data.p4p.updatedBy}{/if}
					</p>
				{/if}
			</div>

			{#if data.p4p?.entries?.length > 0}
				<div class="p4p-table" role="table" aria-label="Pound for Pound World Ranking">
					<div class="p4p-head" role="row">
						<span role="columnheader">#</span>
						<span role="columnheader">Fighter</span>
						<span role="columnheader">Nationality</span>
						<span role="columnheader">Note</span>
					</div>
					{#each data.p4p.entries as entry}
						<div class="p4p-row" role="row">
							<span class="p4p-pos" role="cell">{entry.position}</span>
							<span class="p4p-fighter" role="cell">
								<a href="/fighters/{entry.fighterId}" class="p4p-link">{entry.fighter.name}</a>
								{#if entry.fighter.orgs?.length}
									<span class="p4p-orgs">{entry.fighter.orgs.join(' · ')}</span>
								{/if}
							</span>
							<span class="p4p-nat" role="cell">
								{#if entry.fighter.flags}<span class="p4p-flag">{entry.fighter.flags}</span>{/if}
								{entry.fighter.nationalities?.[0] ?? entry.fighter.country ?? '—'}
							</span>
							<span class="p4p-note" role="cell">{entry.note || ''}</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p4p-empty">
					<p>Ranking not yet published.</p>
					<p class="p4p-empty-sub">Check back soon — the P4P World Ranking will be available here once published by the admin.</p>
				</div>
			{/if}
		</div>

	<!-- ── WBC / RWS content ── -->
	{:else}
		{#if data.organisations.length > 0}
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

		{#if selectedRanking}
			<RankingList ranking={selectedRanking} />
		{:else if data.selectedOrganisationId && data.selectedWeightClassId}
			<StatusMessage
				type="warning"
				message="No ranking entries found for this weight class."
			/>
		{/if}
	{/if}
</section>

<style>
	.rankings-page {
		display: grid;
		gap: 1.5rem;
		max-width: 1100px;
	}

	/* ── Tabs ── */
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

	/* ── P4P section ── */
	.p4p-section {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		overflow: hidden;
	}

	.p4p-heading {
		align-items: flex-end;
		border-bottom: 1px solid #2b2415;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		padding: 1rem;
	}

	.p4p-eyebrow {
		color: #bdb4a1;
		font-size: 0.85rem;
		margin: 0;
	}

	.p4p-title {
		color: #f7f1e5;
		font-size: 1.35rem;
		margin: 0.2rem 0 0;
	}

	.p4p-meta {
		color: #7a7062;
		font-size: 0.82rem;
		margin: 0;
		white-space: nowrap;
	}

	.p4p-table {
		display: grid;
	}

	.p4p-head {
		background: #1b1812;
		color: #d6a33d;
		display: grid;
		font-size: 0.82rem;
		font-weight: 700;
		gap: 1rem;
		grid-template-columns: 3.5rem minmax(12rem, 1.5fr) minmax(8rem, 0.8fr) minmax(8rem, 1fr);
		padding: 0.75rem 1rem;
		text-transform: uppercase;
	}

	.p4p-row {
		border-top: 1px solid #1b1812;
		display: grid;
		font-size: 0.9rem;
		gap: 1rem;
		grid-template-columns: 3.5rem minmax(12rem, 1.5fr) minmax(8rem, 0.8fr) minmax(8rem, 1fr);
		padding: 0.7rem 1rem;
		transition: background 0.1s ease;
	}

	.p4p-row:hover {
		background: #161410;
	}

	.p4p-pos {
		color: #d6a33d;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.p4p-fighter {
		display: grid;
		gap: 0.15rem;
	}

	.p4p-link {
		color: #f4efe4;
		font-weight: 600;
		text-decoration: none;
	}

	.p4p-link:hover {
		color: #d6a33d;
	}

	.p4p-orgs {
		color: #7a7062;
		font-size: 0.78rem;
	}

	.p4p-nat {
		align-items: center;
		color: #bdb4a1;
		display: flex;
		gap: 0.4rem;
	}

	.p4p-flag {
		font-size: 1.1rem;
		line-height: 1;
	}

	.p4p-note {
		color: #7a7062;
		font-size: 0.82rem;
		font-style: italic;
	}

	.p4p-empty {
		padding: 2.5rem 1rem;
		text-align: center;
	}

	.p4p-empty p {
		color: #f4efe4;
		font-size: 1.05rem;
		margin: 0;
	}

	.p4p-empty-sub {
		color: #7a7062 !important;
		font-size: 0.85rem !important;
		margin-top: 0.5rem !important;
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

		.p4p-head {
			display: none;
		}

		.p4p-row {
			grid-template-columns: 2.5rem 1fr;
			grid-template-rows: auto auto;
		}

		.p4p-note {
			grid-column: 2;
		}
	}
</style>
