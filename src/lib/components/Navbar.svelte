<script>
	let { user = null } = $props();

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

		{#if user}
			<a href="/favorites">Favorites</a>
			{#if user.role === 'admin'}
				<a href="/admin">Admin</a>
				<a href="/admin/fighters">Fighters</a>
			{/if}
			<a href="/account" class="account-icon" aria-label="Account">
				<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="12" cy="8" r="4" />
					<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
				</svg>
			</a>
			<form method="POST" action="/logout">
				<button type="submit">Logout</button>
			</form>
		{:else}
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
	button {
		color: #f4efe4;
		font-size: 0.95rem;
		text-decoration: none;
	}

	a:hover {
		color: #d6a33d;
	}

	form {
		margin: 0;
	}

	button {
		background: transparent;
		border: 0;
		cursor: pointer;
		font: inherit;
		padding: 0;
	}

	button:hover {
		color: #d6a33d;
	}

	.account-icon {
		align-items: center;
		color: #bdb4a1;
		display: flex;
		line-height: 0;
	}

	.account-icon:hover {
		color: #d6a33d;
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
