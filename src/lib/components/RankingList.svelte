<script>
	import RankingRow from './RankingRow.svelte';

	let { ranking } = $props();
</script>

<section class="ranking-list" aria-labelledby="ranking-title">
	<div class="heading">
		<div>
			<p class="eyebrow">Ranking list</p>
			<h2 id="ranking-title">{ranking.organisation.name} - {ranking.weightClass.name}</h2>
		</div>
		{#if ranking.updatedAt}
			<p class="updated">Updated {ranking.updatedAt}</p>
		{/if}
	</div>

	{#if ranking.entries.length > 0}
		<div class="table" role="table" aria-label={`${ranking.organisation.name} ${ranking.weightClass.name}`}>
			<div class="table-head" role="row">
				<span role="columnheader">Position</span>
				<span role="columnheader">Fighter</span>
				<span role="columnheader">Country</span>
				<span role="columnheader">Organisation</span>
				<span role="columnheader">Weight class</span>
			</div>
			{#each ranking.entries as entry}
				<RankingRow {entry} organisation={ranking.organisation} weightClass={ranking.weightClass} />
			{/each}
		</div>
	{:else}
		<p class="empty">No entries are available for this ranking.</p>
	{/if}
</section>

<style>
	.ranking-list {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		overflow: hidden;
	}

	.heading {
		align-items: end;
		border-bottom: 1px solid #2b2415;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		padding: 1rem;
	}

	.eyebrow,
	.updated {
		color: #bdb4a1;
		font-size: 0.85rem;
		margin: 0;
	}

	h2 {
		color: #f7f1e5;
		font-size: 1.35rem;
		margin: 0.2rem 0 0;
	}

	.table {
		display: grid;
	}

	.table-head {
		background: #1b1812;
		color: #d6a33d;
		display: grid;
		font-size: 0.82rem;
		font-weight: 700;
		gap: 1rem;
		grid-template-columns: 8rem minmax(12rem, 1.2fr) minmax(8rem, 0.8fr) minmax(8rem, 0.8fr) minmax(8rem, 0.8fr);
		padding: 0.75rem 1rem;
		text-transform: uppercase;
	}

	.empty {
		color: #cfc6b3;
		margin: 0;
		padding: 1rem;
	}

	@media (max-width: 850px) {
		.heading {
			align-items: start;
			flex-direction: column;
		}

		.table-head {
			display: none;
		}
	}
</style>
