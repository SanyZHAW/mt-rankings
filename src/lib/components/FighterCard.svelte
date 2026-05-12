<script>
	let { fighter } = $props();
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
	<a href={`/fighters/${fighter.id}`}>View fighter</a>
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

	a {
		color: #d6a33d;
		font-weight: 700;
		text-decoration: none;
		width: fit-content;
	}

	a:hover {
		color: #efbf58;
	}
</style>
