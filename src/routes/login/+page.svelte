<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { form } = $props();
</script>

<section class="auth-page">
	<PageHeader title="Login" subtitle="Sign in to prepare user-specific favorites." />

	{#if form?.message}
		<StatusMessage type="error" message={form.message} />
	{/if}

	<form method="POST" class="auth-form">
		<label>
			<span>Email or username</span>
			<input
				type="text"
				name="identifier"
				value={form?.identifier ?? ''}
				autocomplete="username"
				required
			/>
		</label>

		<label>
			<span>Password</span>
			<input type="password" name="password" autocomplete="current-password" required />
		</label>

		<button type="submit">Login</button>
	</form>
</section>

<style>
	.auth-page {
		display: grid;
		gap: 1.25rem;
		max-width: 560px;
	}

	.auth-form {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 1rem;
		padding: 1rem;
	}

	label {
		display: grid;
		gap: 0.4rem;
	}

	span {
		color: #d6a33d;
		font-weight: 700;
	}

	input,
	button {
		border-radius: 8px;
		font: inherit;
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
	}

	input {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		color: #f4efe4;
	}

	button {
		background: #d6a33d;
		border: 0;
		color: #111111;
		cursor: pointer;
		font-weight: 700;
	}
</style>
