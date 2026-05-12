<script>
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<Navbar user={data.user} />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		background: #0b0b0b;
		color: #f4efe4;
		font-family:
			Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		margin: 0;
	}

	:global(a) {
		color: inherit;
	}

	.app-shell {
		background:
			linear-gradient(180deg, #14110b 0%, #0b0b0b 32rem),
			#0b0b0b;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		padding: clamp(1.25rem, 4vw, 3rem);
	}
</style>
