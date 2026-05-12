<script>
	let { fighter, showRemove = false } = $props();
</script>

<article class="fighter-card">
	<h2>{fighter.name}</h2>
	<dl>
		<div>
			<dt>Country</dt>
			<dd>{fighter.country || 'Not available'}</dd>
		</div>
		<div>
			<dt>Record</dt>
			<dd>{fighter.record || 'Not available'}</dd>
		</div>
	</dl>
	<div class="actions">
		<a href={`/fighters/${fighter.id}`}>View fighter</a>
		{#if showRemove}
			<form method="POST" action="?/remove">
				<input type="hidden" name="fighterId" value={fighter.id} />
				<button type="submit">Remove</button>
			</form>
		{/if}
	</div>
</article>

<style>
	.fighter-card {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 1rem;
		padding: 1rem;
	}

	h2 {
		color: #f7f1e5;
		font-size: 1.15rem;
		margin: 0;
	}

	dl {
		display: grid;
		gap: 0.75rem;
		margin: 0;
	}

	dt {
		color: #bdb4a1;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	dd {
		color: #f4efe4;
		margin: 0.2rem 0 0;
	}

	.actions {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	a,
	button {
		color: #d6a33d;
		font: inherit;
		font-weight: 700;
		text-decoration: none;
		width: fit-content;
	}

	a:hover,
	button:hover {
		color: #efbf58;
	}

	form {
		margin: 0;
	}

	button {
		background: transparent;
		border: 0;
		cursor: pointer;
		padding: 0;
	}
</style>
