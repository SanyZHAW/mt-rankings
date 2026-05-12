<script>
	let { isLoggedIn = false } = $props();

	const publicLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/rankings', label: 'Rankings' }
	];

	const authLinks = [
		{ href: '/login', label: 'Login' },
		{ href: '/register', label: 'Register' }
	];
</script>

<nav class="navbar" aria-label="Main navigation">
	<a class="brand" href="/">MT Rankings</a>

	<div class="links">
		{#each publicLinks as link}
			<a href={link.href}>{link.label}</a>
		{/each}

		{#if isLoggedIn}
			<a href="/favorites">Favorites</a>
		{:else}
			<span class="disabled-link" title="Login required">Favorites</span>
			{#each authLinks as link}
				<a href={link.href}>{link.label}</a>
			{/each}
		{/if}
	</div>
</nav>

<style>
	.navbar {
		align-items: center;
		background: #111111;
		border-bottom: 1px solid #2b2415;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		padding: 1rem clamp(1rem, 4vw, 3rem);
	}

	.brand {
		color: #d6a33d;
		font-size: 1.15rem;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
	}

	.links {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.9rem;
		justify-content: flex-end;
	}

	a,
	.disabled-link {
		color: #f4efe4;
		font-size: 0.95rem;
		text-decoration: none;
	}

	a:hover {
		color: #d6a33d;
	}

	.disabled-link {
		cursor: not-allowed;
		opacity: 0.45;
	}

	@media (max-width: 640px) {
		.navbar {
			align-items: flex-start;
			flex-direction: column;
		}

		.links {
			justify-content: flex-start;
		}
	}
</style>
