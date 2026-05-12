<script>
	let { fighter } = $props();

	const details = $derived([
		{ label: 'Country', value: fighter.country },
		{ label: 'Age', value: fighter.age },
		{ label: 'Record', value: fighter.record }
	]);
</script>

<section class="fighter-detail" aria-labelledby="fighter-detail-title">
	<h2 id="fighter-detail-title">Fighter details</h2>
	<dl>
		{#each details as detail}
			<div>
				<dt>{detail.label}</dt>
				<dd>{detail.value || 'Not available'}</dd>
			</div>
		{/each}
	</dl>
</section>

<style>
	.fighter-detail {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		padding: 1rem;
	}

	h2 {
		color: #d6a33d;
		font-size: 1.1rem;
		margin: 0 0 1rem;
	}

	dl {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin: 0;
	}

	div {
		background: #161616;
		border: 1px solid #242015;
		border-radius: 8px;
		padding: 0.85rem;
	}

	dt {
		color: #bdb4a1;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	dd {
		color: #f4efe4;
		margin: 0.25rem 0 0;
	}

	@media (max-width: 700px) {
		dl {
			grid-template-columns: 1fr;
		}
	}
</style>
