<script>
	let {
		isLoggedIn = false,
		message = isLoggedIn
			? 'Favorites saving will be connected in the next step.'
			: 'Log in to save favorites'
	} = $props();

	const disabled = $derived(!isLoggedIn);
</script>

<div class="favorite-card">
	<button type="button" {disabled}>Save favorite</button>
	<p>{message}</p>
</div>

<style>
	.favorite-card {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
	}

	button {
		background: #d6a33d;
		border: 0;
		border-radius: 8px;
		color: #111111;
		font: inherit;
		font-weight: 700;
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	p {
		color: #cfc6b3;
		line-height: 1.5;
		margin: 0;
	}
</style>
