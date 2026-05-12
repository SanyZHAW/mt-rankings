<script>
	let {
		isLoggedIn = false,
		isFavorite = false,
		message = isLoggedIn
			? isFavorite
				? 'This fighter is already in your favorites.'
				: 'Save this fighter to your personal favorites.'
			: 'Log in to save favorites'
	} = $props();

	const disabled = $derived(!isLoggedIn || isFavorite);
</script>

<form class="favorite-card" method="POST" action="?/favorite">
	<button type="submit" {disabled}>{isFavorite ? 'Saved favorite' : 'Save favorite'}</button>
	<p>{message}</p>
</form>

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
