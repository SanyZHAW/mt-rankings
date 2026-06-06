<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data, form } = $props();

	// ── per-field edit state ───────────────────────────────────────────────────
	let editing = $state({ firstName: false, lastName: false, username: false, email: false });

	const startEdit = (field) => { editing[field] = true; };
	const cancelEdit = (field) => { editing[field] = false; };

	// Reset edit mode on successful save
	$effect(() => {
		if (form?.action === 'profile' && form?.success) {
			editing[form.field] = false;
		}
	});

	// Profile fields config
	const profileFields = $derived([
		{ key: 'firstName', label: 'First name',  type: 'text',  value: data.user.firstName },
		{ key: 'lastName',  label: 'Last name',   type: 'text',  value: data.user.lastName  },
		{ key: 'username',  label: 'Username',    type: 'text',  value: data.user.username  },
		{ key: 'email',     label: 'Email',       type: 'email', value: data.user.email     }
	]);
</script>

<section class="account-page">
	<PageHeader title="Account" subtitle="Manage your profile and password." />

	<!-- ── Profile ──────────────────────────────────────────────────────────── -->
	<div class="card">
		<h2>Profile</h2>

		<dl class="field-list">
			{#each profileFields as f}
				<div class="field-row">
					<div class="field-meta">
						<dt>{f.label}</dt>
						{#if !editing[f.key]}
							<dd>
								{#if f.value}
									{f.value}
								{:else}
									<span class="empty">—</span>
								{/if}
							</dd>
						{/if}
					</div>

					{#if editing[f.key]}
						<form method="POST" action="?/updateProfile" class="inline-form">
							<input type="hidden" name="field" value={f.key} />
							<input
								type={f.type}
								name="value"
								value={f.value}
								class="inline-input"
								autocomplete="off"
								required={f.key === 'firstName' || f.key === 'email'}
							/>
							<div class="inline-actions">
								<button type="submit" class="btn-save">Save</button>
								<button type="button" class="btn-cancel" onclick={() => cancelEdit(f.key)}>Cancel</button>
							</div>
						</form>
						{#if form?.action === 'profile' && form?.field === f.key && !form?.success}
							<StatusMessage type="error" message={form.message} />
						{/if}
					{:else}
						<button type="button" class="btn-edit" onclick={() => startEdit(f.key)}>Edit</button>
					{/if}

					{#if form?.action === 'profile' && form?.field === f.key && form?.success}
						<StatusMessage type="success" message="Saved." />
					{/if}
				</div>
			{/each}
		</dl>
	</div>

	<!-- ── Password ─────────────────────────────────────────────────────────── -->
	<div class="card">
		<h2>Change password</h2>

		{#if form?.action === 'password'}
			<StatusMessage type={form.success ? 'success' : 'error'} message={form.success ? 'Password updated.' : form.message} />
		{/if}

		<form method="POST" action="?/updatePassword" class="password-form">
			<label>
				<span>Current password</span>
				<input type="password" name="currentPassword" autocomplete="current-password" required />
			</label>
			<label>
				<span>New password</span>
				<input type="password" name="newPassword" autocomplete="new-password" minlength="6" required />
			</label>
			<label>
				<span>Confirm new password</span>
				<input type="password" name="confirmPassword" autocomplete="new-password" required />
			</label>
			<button type="submit" class="btn-primary">Update password</button>
		</form>
	</div>
</section>

<style>
	.account-page {
		display: grid;
		gap: 1.5rem;
		margin: 0 auto;
		max-width: 640px;
	}

	.card {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		padding: 1.25rem;
	}

	h2 {
		color: #d6a33d;
		font-size: 1.05rem;
		margin: 0 0 1rem;
	}

	/* ── field list ── */

	.field-list {
		display: grid;
		gap: 0;
		margin: 0;
	}

	.field-row {
		align-items: center;
		border-top: 1px solid #1e1c14;
		display: grid;
		gap: 0.5rem 1rem;
		grid-template-columns: 1fr auto;
		padding: 0.75rem 0;
	}

	.field-row:first-child {
		border-top: none;
		padding-top: 0;
	}

	.field-row:last-child {
		padding-bottom: 0;
	}

	.field-meta {
		display: grid;
		gap: 0.15rem;
	}

	dt {
		color: #bdb4a1;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	dd {
		color: #f4efe4;
		margin: 0;
	}

	.empty {
		color: #5a5347;
	}

	/* ── inline edit form ── */

	.inline-form {
		display: contents;
	}

	.inline-input {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		border-radius: 6px;
		color: #f4efe4;
		font: inherit;
		grid-column: 1;
		min-height: 2.25rem;
		padding: 0.4rem 0.6rem;
		width: 100%;
	}

	.inline-actions {
		display: flex;
		gap: 0.4rem;
		grid-column: 2;
	}

	/* Status messages inside field rows span full width */
	.field-row :global(.status) {
		grid-column: 1 / -1;
	}

	/* ── buttons ── */

	.btn-edit {
		background: transparent;
		border: 1px solid #3a321f;
		border-radius: 6px;
		color: #bdb4a1;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.75rem;
		white-space: nowrap;
	}

	.btn-edit:hover {
		border-color: #d6a33d;
		color: #d6a33d;
	}

	.btn-save {
		background: #d6a33d;
		border: 0;
		border-radius: 6px;
		color: #111111;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		padding: 0.3rem 0.75rem;
		white-space: nowrap;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid #3a321f;
		border-radius: 6px;
		color: #bdb4a1;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.6rem;
		white-space: nowrap;
	}

	.btn-cancel:hover {
		color: #f4efe4;
	}

	/* ── password form ── */

	.password-form {
		display: grid;
		gap: 0.9rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
	}

	span {
		color: #bdb4a1;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.password-form input {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		border-radius: 6px;
		color: #f4efe4;
		font: inherit;
		min-height: 2.5rem;
		padding: 0.55rem 0.75rem;
	}

	.btn-primary {
		background: #d6a33d;
		border: 0;
		border-radius: 8px;
		color: #111111;
		cursor: pointer;
		font: inherit;
		font-weight: 700;
		min-height: 2.5rem;
		padding: 0.55rem 1rem;
	}

	.btn-primary:hover {
		background: #efbf58;
	}
</style>
