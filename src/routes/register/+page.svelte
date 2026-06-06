<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { form } = $props();
</script>

<section class="auth-page">
	<PageHeader
		title="Register"
		subtitle="Create a prototype account so favorites can later be saved per user."
	/>

	{#if form?.message}
		<StatusMessage type="error" message={form.message} />
	{/if}

	<form method="POST" class="auth-form">
		<div class="name-row">
			<label>
				<span>First name <em>*</em></span>
				<input
					type="text"
					name="firstName"
					value={form?.firstName ?? ''}
					autocomplete="given-name"
					required
				/>
			</label>
			<label>
				<span>Last name</span>
				<input
					type="text"
					name="lastName"
					value={form?.lastName ?? ''}
					autocomplete="family-name"
				/>
			</label>
		</div>

		<label>
			<span>Username <em>*</em></span>
			<input
				type="text"
				name="username"
				value={form?.username ?? ''}
				autocomplete="username"
				pattern={'[a-zA-Z0-9_]{3,20}'}
				title="3–20 characters: letters, digits, or underscores"
				required
			/>
		</label>

		<label>
			<span>Email <em>*</em></span>
			<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required />
		</label>

		<label>
			<span>Password <em>*</em></span>
			<input type="password" name="password" autocomplete="new-password" minlength="6" required />
		</label>

		<button type="submit">Create account</button>
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

	.name-row {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr 1fr;
	}

	label {
		display: grid;
		gap: 0.4rem;
	}

	span {
		color: #d6a33d;
		font-weight: 700;
	}

	em {
		color: #e05c5c;
		font-style: normal;
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

	@media (max-width: 480px) {
		.name-row {
			grid-template-columns: 1fr;
		}
	}
</style>
