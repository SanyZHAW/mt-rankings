<script>
	let { rankingEntries = [] } = $props();

	const isChampionPosition = (position) => Number.isNaN(Number(position));
</script>

<section class="ranking-table" aria-labelledby="fighter-rankings-title">
	<h2 id="fighter-rankings-title">Ranking entries</h2>

	{#if rankingEntries.length > 0}
		<div class="table" role="table" aria-label="Fighter ranking entries">
			<div class="table-head" role="row">
				<span role="columnheader">Organisation</span>
				<span role="columnheader">Weight class</span>
				<span role="columnheader">Position</span>
			</div>
			{#each rankingEntries as entry}
				<div class="table-row" role="row">
					<span role="cell" data-label="Organisation">{entry.organisation?.name || 'Unknown'}</span>
					<span role="cell" data-label="Weight class">{entry.weightClass?.name || 'Unknown'}</span>
					<span
						class:champion={isChampionPosition(entry.position)}
						role="cell"
						data-label="Position"
					>
						{entry.position}
					</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty">No ranking entries are available for this fighter.</p>
	{/if}
</section>

<style>
	.ranking-table {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		overflow: hidden;
	}

	h2 {
		border-bottom: 1px solid #2b2415;
		color: #d6a33d;
		font-size: 1.1rem;
		margin: 0;
		padding: 1rem;
	}

	.table {
		display: grid;
	}

	.table-head,
	.table-row {
		display: grid;
		gap: 1rem;
		grid-template-columns: minmax(10rem, 1fr) minmax(10rem, 1fr) minmax(8rem, 0.8fr);
		padding: 0.85rem 1rem;
	}

	.table-head {
		background: #1b1812;
		color: #d6a33d;
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.table-row {
		border-top: 1px solid #242015;
		color: #f4efe4;
	}

	.champion {
		color: #d6a33d;
		font-weight: 700;
	}

	.empty {
		color: #cfc6b3;
		margin: 0;
		padding: 1rem;
	}

	@media (max-width: 700px) {
		.table-head {
			display: none;
		}

		.table-row {
			gap: 0.45rem;
			grid-template-columns: 1fr;
		}

		.table-row span {
			display: grid;
			gap: 0.15rem;
		}

		.table-row span::before {
			color: #bdb4a1;
			content: attr(data-label);
			font-size: 0.78rem;
			font-weight: 700;
			text-transform: uppercase;
		}
	}
</style>
