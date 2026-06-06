<script>
	import FighterBrowser from '$lib/components/FighterBrowser.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data, form } = $props();

	let activeTab = $state('fighters');

	// ── Sync state ────────────────────────────────────────────────────────────
	let wbcLoading = $state(false);
	let wbcResult  = $state(null);
	let rwsLoading = $state(false);
	let rwsResult  = $state(null);

	async function syncWbc() {
		wbcLoading = true; wbcResult = null;
		try { wbcResult = await fetch('/api/admin/scrape', { method: 'POST' }).then((r) => r.json()); }
		catch (e) { wbcResult = { error: e.message }; }
		finally { wbcLoading = false; }
	}

	async function syncRws() {
		rwsLoading = true; rwsResult = null;
		try { rwsResult = await fetch('/api/admin/scrape/rws', { method: 'POST' }).then((r) => r.json()); }
		catch (e) { rwsResult = { error: e.message }; }
		finally { rwsLoading = false; }
	}

	const tabs = [
		{ id: 'fighters', label: 'Fighters' },
		{ id: 'users',    label: 'Users'    },
		{ id: 'sync',     label: 'Sync'     }
	];
</script>

<section class="admin-page">
	<PageHeader title="Admin" subtitle="Manage fighters, users, and data sync." />

	<nav class="tab-nav" aria-label="Admin sections">
		{#each tabs as tab}
			<button
				class="tab-btn"
				class:active={activeTab === tab.id}
				onclick={() => { activeTab = tab.id; }}
				type="button"
			>{tab.label}</button>
		{/each}
	</nav>

	<!-- ── Fighters tab ──────────────────────────────────────────────────────── -->
	{#if activeTab === 'fighters'}
		{#if form?.action === 'updateFighter' && !form?.success}
			<StatusMessage type="error" message={form.message} />
		{/if}
		{#if form?.action === 'deleteFighter' && !form?.success}
			<StatusMessage type="error" message={form.message} />
		{/if}
		<FighterBrowser
			fighters={data.fighters}
			organisations={data.organisations}
			isAdmin={true}
			{form}
		/>

	<!-- ── Users tab ─────────────────────────────────────────────────────────── -->
	{:else if activeTab === 'users'}
		{#if form?.action === 'user'}
			{#if form.success}
				<StatusMessage type="success" message="Changes saved." />
			{:else}
				<StatusMessage type="error" message={form.message} />
			{/if}
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
									<option value="user"  selected={u.role === 'user'}>User</option>
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

	<!-- ── Sync tab ──────────────────────────────────────────────────────────── -->
	{:else if activeTab === 'sync'}
		<div class="panel">
			<div class="panel-header">
				<span class="panel-title">WBC Rankings</span>
				<button class="btn-scrape" onclick={syncWbc} disabled={wbcLoading}>
					{#if wbcLoading}<span class="spinner" aria-hidden="true"></span>Syncing…{:else}Sync WBC from XML{/if}
				</button>
			</div>
			<p class="workflow-note">
				Run <code>python static/scripts/scrape_wbc.py</code> locally, commit
				<code>static/data/wbc_rankings.xml</code>, then click <strong>Sync WBC from XML</strong>.
			</p>
			{#if wbcResult?.success}
				<StatusMessage type="success" message="Synced {wbcResult.updatedAt} — {wbcResult.fighters} fighters, {wbcResult.rankings} weight classes" />
			{:else if wbcResult?.error}
				<StatusMessage type="error" message="Sync failed: {wbcResult.error}" />
			{/if}
		</div>

		<div class="panel">
			<div class="panel-header">
				<span class="panel-title">RWS Rankings</span>
				<button class="btn-scrape" onclick={syncRws} disabled={rwsLoading}>
					{#if rwsLoading}<span class="spinner" aria-hidden="true"></span>Syncing…{:else}Sync RWS from XML{/if}
				</button>
			</div>
			<p class="workflow-note">
				Run <code>python static/scripts/scrape_rws.py</code> locally, commit
				<code>static/data/rws_rankings.xml</code>, then click <strong>Sync RWS from XML</strong>.
			</p>
			{#if rwsResult?.success}
				<StatusMessage type="success" message="Synced {rwsResult.updatedAt} — {rwsResult.fighters} fighters, {rwsResult.rankings} weight classes" />
			{:else if rwsResult?.error}
				<StatusMessage type="error" message="Sync failed: {rwsResult.error}" />
			{/if}
		</div>
	{/if}
</section>

<style>
	.admin-page {
		display: grid;
		gap: 1.25rem;
		max-width: 1000px;
	}

	/* ── tabs ── */
	.tab-nav {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid #2b2415;
		padding-bottom: 0;
	}

	.tab-btn {
		background: transparent;
		border: 1px solid transparent;
		border-bottom: none;
		border-radius: 6px 6px 0 0;
		color: #bdb4a1;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.5rem 1.1rem;
		position: relative;
		bottom: -1px;
	}

	.tab-btn:hover {
		color: #f4efe4;
	}

	.tab-btn.active {
		background: #111111;
		border-color: #2b2415;
		border-bottom-color: #111111;
		color: #d6a33d;
		font-weight: 700;
	}

	/* ── user list ── */
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

	input, select, button {
		border-radius: 6px;
		font: inherit;
		min-height: 2.5rem;
		padding: 0.5rem 0.65rem;
	}

	input, select {
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
		align-items: flex-end;
		display: flex;
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

	/* ── sync panels ── */
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

	.workflow-note strong { color: #d6a33d; }

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

	.btn-scrape:hover:not(:disabled) { background: #1e3d22; }
	.btn-scrape:disabled { cursor: not-allowed; opacity: 0.6; }

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

	@keyframes spin { to { transform: rotate(360deg); } }
</style>
