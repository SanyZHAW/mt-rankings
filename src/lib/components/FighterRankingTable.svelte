<script>
	let { rankings = [] } = $props();

	const isChampion = (pos) => Number.isNaN(Number(pos));

	// Group entries by organisation display name, preserving insertion order
	const byOrg = $derived(
		rankings.reduce((acc, entry) => {
			if (!acc[entry.org]) acc[entry.org] = [];
			acc[entry.org].push(entry);
			return acc;
		}, {})
	);
</script>

<section class="ranking-table" aria-labelledby="fighter-rankings-title">
	<h2 id="fighter-rankings-title">Ranking entries</h2>

	{#if rankings.length > 0}
		{#each Object.entries(byOrg) as [orgName, entries]}
			<div class="org-group">
				<h3>{orgName}</h3>
				<div class="table" role="table" aria-label="{orgName} ranking entries">
					<div class="table-head" role="row">
						<span role="columnheader">Weight class</span>
						<span role="columnheader">Position</span>
					</div>
					{#each entries as entry}
						<div class="table-row" role="row">
							<span role="cell" data-label="Weight class">{entry.weightClassName || 'Unknown'}</span>
							<span
								class:champion={isChampion(entry.position)}
								role="cell"
								data-label="Position"
							>
								{entry.position}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
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

	.org-group {
		border-top: 1px solid #2b2415;
	}

	.org-group:first-of-type {
		border-top: none;
	}

	h3 {
		background: #1b1812;
		color: #d6a33d;
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		margin: 0;
		padding: 0.6rem 1rem;
		text-transform: uppercase;
	}

	.table {
		display: grid;
	}

	.table-head,
	.table-row {
		display: grid;
		gap: 1rem;
		grid-template-columns: minmax(10rem, 1fr) minmax(8rem, 0.8fr);
		padding: 0.85rem 1rem;
	}

	.table-head {
		background: #161616;
		color: #bdb4a1;
		font-size: 0.8rem;
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
