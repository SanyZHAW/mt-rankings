<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();

	function goBack() {
		if (history.length > 1) {
			history.back();
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<Navbar user={data.user} />
	<main>
		{#if $page.url.pathname !== '/'}
			<button class="back-btn" onclick={goBack} aria-label="Go back">
				<svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M19 12H5M12 19l-7-7 7-7"/>
				</svg>
				<span class="back-text">Back</span>
			</button>
		{/if}
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

	.back-btn {
		align-items: center;
		background: transparent;
		border: none;
		color: #7a7062;
		cursor: pointer;
		display: flex;
		font: inherit;
		gap: 0.35rem;
		margin-bottom: 1rem;
		padding: 0.2rem 0;
		transition: color 0.15s ease;
	}

	.back-btn:hover {
		color: #d6a33d;
	}

	.back-icon {
		flex-shrink: 0;
		height: 18px;
		width: 18px;
	}

	.back-text {
		font-size: 0.88rem;
	}

	@media (max-width: 500px) {
		.back-text {
			display: none;
		}
	}
</style>
