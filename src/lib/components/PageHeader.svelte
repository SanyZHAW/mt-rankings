<script>
	let { title, subtitle = '' } = $props();
</script>

<header class="page-header">
	<h1>{title}</h1>
	{#if subtitle}
		<p>{subtitle}</p>
	{/if}
</header>

<style>
	.page-header {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		color: #f7f1e5;
		font-size: clamp(2rem, 5vw, 3.5rem);
		line-height: 1.05;
		margin: 0;
	}

	p {
		color: #cfc6b3;
		font-size: 1rem;
		line-height: 1.6;
		margin: 0;
		max-width: 64ch;
	}
</style>
