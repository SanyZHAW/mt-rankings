<script>
	let { entry, organisation, weightClass } = $props();

	const fighter = $derived(entry.fighter);
	const isChampionPosition = $derived(Number.isNaN(Number(entry.position)));
</script>

<div class="ranking-row" role="row">
	<span class:champion={isChampionPosition} role="cell" data-label="Position">{entry.position}</span>
	<span role="cell" data-label="Fighter">
		{#if fighter}
			<a href={`/fighters/${fighter.id}`}>{fighter.name}</a>
		{:else}
			<span class="missing">Unknown fighter</span>
		{/if}
	</span>
	<span role="cell" data-label="Country">{fighter?.country || 'Not available'}</span>
	<span role="cell" data-label="Organisation">{organisation.name}</span>
	<span role="cell" data-label="Weight class">{weightClass.name}</span>
</div>

<style>
	.ranking-row {
		border-top: 1px solid #242015;
		color: #f4efe4;
		display: grid;
		gap: 1rem;
		grid-template-columns: 8rem minmax(12rem, 1.2fr) minmax(8rem, 0.8fr) minmax(8rem, 0.8fr) minmax(8rem, 0.8fr);
		padding: 0.85rem 1rem;
	}

	.ranking-row:first-of-type {
		border-top: 0;
	}

	a {
		color: #f7f1e5;
		font-weight: 700;
		text-decoration: none;
	}

	a:hover {
		color: #d6a33d;
	}

	.champion {
		color: #d6a33d;
		font-weight: 700;
	}

	.missing {
		color: #ffb4b4;
	}

	@media (max-width: 850px) {
		.ranking-row {
			gap: 0.45rem;
			grid-template-columns: 1fr;
		}

		span {
			display: grid;
			gap: 0.15rem;
		}

		span::before {
			color: #bdb4a1;
			content: attr(data-label);
			font-size: 0.78rem;
			font-weight: 700;
			text-transform: uppercase;
		}
	}
</style>
