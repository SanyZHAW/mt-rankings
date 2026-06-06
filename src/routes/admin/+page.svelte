<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data, form } = $props();

	let scrapeLoading = $state(false);
	let scrapeResult = $state(null);

	async function syncRankings() {
		scrapeLoading = true;
		scrapeResult = null;
		try {
			const res = await fetch('/api/admin/scrape', { method: 'POST' });
			scrapeResult = await res.json();
		} catch (e) {
			scrapeResult = { error: e.message };
		} finally {
			scrapeLoading = false;
		}
	}
</script>

<section class="admin-page">
	<PageHeader title="Admin" subtitle="Manage all registered user accounts." />

	<div class="panel">
		<div class="panel-header">
			<span class="panel-title">WBC Rankings</span>
			<button class="btn-scrape" onclick={syncRankings} disabled={scrapeLoading}>
				{#if scrapeLoading}
					<span class="spinner" aria-hidden="true"></span>
					Syncing…
				{:else}
					Sync Rankings from XML
				{/if}
			</button>
		</div>
		<p class="workflow-note">
			To update rankings: run <code>python scripts/scrape_wbc.py</code> locally, commit
			<code>static/data/wbc_rankings.xml</code>, then click <strong>Sync Rankings from XML</strong>
			to push the changes to the database.
		</p>
		{#if scrapeResult?.success}
			<StatusMessage type="success" message="Synced — {scrapeResult.updatedAt} ({scrapeResult.fighters} fighters, {scrapeResult.rankings} weight classes)" />
		{:else if scrapeResult?.error}
			<StatusMessage type="error" message="Sync failed: {scrapeResult.error}" />
		{/if}
	</div>

	{#if form?.message}
		<StatusMessage type="error" message={form.message} />
	{/if}
	{#if form?.success}
		<StatusMessage type="success" message="Changes saved." />
	{/if}

	{#if data.users.length === 0}
		<StatusMessage type="info" message="No users registered yet." />
	{:else}
		<div class="user-list">
			{#each data.users as u}
				<div class="user-row">
					<form method="POST" action="?/update" class="update-form">
						<input type="hidden" name="id" value={u.id} />

						<label class="field">
							<span>Email</span>
							<input type="email" name="email" value={u.email} required />
						</label>

						<label class="field">
							<span>Role</span>
							<select name="role">
								<option value="user" selected={u.role === 'user'}>User</option>
								<option value="admin" selected={u.role === 'admin'}>Admin</option>
							</select>
						</label>

						<button type="submit" class="btn-save">Save</button>
					</form>

					<form method="POST" action="?/delete" class="delete-form">
						<input type="hidden" name="id" value={u.id} />
						<button
							type="submit"
							class="btn-delete"
							onclick={(e) => { if (!confirm('Permanently delete this user?')) e.preventDefault(); }}
						>Delete</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
	.admin-page {
		display: grid;
		gap: 1.5rem;
		max-width: 860px;
	}

	.user-list {
		display: grid;
		gap: 0.75rem;
	}

	.user-row {
		align-items: flex-end;
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 1rem;
	}

	.update-form {
		align-items: flex-end;
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		gap: 0.75rem;
		min-width: 0;
	}

	.field {
		display: grid;
		flex: 1;
		gap: 0.35rem;
		min-width: 180px;
	}

	span {
		color: #d6a33d;
		font-size: 0.85rem;
		font-weight: 700;
	}

	input,
	select,
	button {
		border-radius: 6px;
		font: inherit;
		min-height: 2.5rem;
		padding: 0.5rem 0.65rem;
	}

	input,
	select {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		color: #f4efe4;
	}

	.btn-save {
		background: #d6a33d;
		border: 0;
		color: #111111;
		cursor: pointer;
		font-weight: 700;
		white-space: nowrap;
	}

	.delete-form {
		display: flex;
		align-items: flex-end;
	}

	.btn-delete {
		background: transparent;
		border: 1px solid #7a2020;
		color: #e05555;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-delete:hover {
		background: #7a2020;
		color: #f4efe4;
	}

	.panel {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
	}

	.panel-header {
		align-items: center;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
	}

	.panel-title {
		color: #d6a33d;
		font-size: 0.9rem;
		font-weight: 700;
	}

	.workflow-note {
		color: #a09070;
		font-size: 0.8rem;
		line-height: 1.5;
		margin: 0;
	}

	.workflow-note code {
		background: #1a1a1a;
		border-radius: 3px;
		color: #c8a84b;
		font-family: monospace;
		font-size: 0.78rem;
		padding: 0.1em 0.35em;
	}

	.workflow-note strong {
		color: #d6a33d;
	}

	.btn-scrape {
		align-items: center;
		background: #142719;
		border: 1px solid #3a8b4b;
		border-radius: 6px;
		color: #d7f8dd;
		cursor: pointer;
		display: inline-flex;
		font: inherit;
		gap: 0.5rem;
		min-height: 2.5rem;
		padding: 0.5rem 0.9rem;
		white-space: nowrap;
	}

	.btn-scrape:hover:not(:disabled) {
		background: #1e3d22;
	}

	.btn-scrape:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.spinner {
		animation: spin 0.8s linear infinite;
		border: 2px solid #3a8b4b;
		border-radius: 50%;
		border-top-color: #d7f8dd;
		display: inline-block;
		flex-shrink: 0;
		height: 0.85rem;
		width: 0.85rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
