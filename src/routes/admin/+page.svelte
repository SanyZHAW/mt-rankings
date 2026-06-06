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
		{ id: 'fighters',     label: 'Fighters'     },
		{ id: 'users',        label: 'Users'        },
		{ id: 'p4p',          label: 'P4P Ranking'  },
		{ id: 'sync',         label: 'Sync'         },
		{ id: 'announcement', label: 'Announcement' }
	];

	// ── P4P editor state ──────────────────────────────────────────────────────
	// Each row: { fighterId, note }
	let p4pRows = $state(
		Array.from({ length: 10 }, (_, i) => {
			const existing = data.p4p?.entries?.[i];
			return {
				fighterId: existing?.fighterId ?? '',
				note:      existing?.note      ?? ''
			};
		})
	);

	let fighterSearch = $state(
		Array.from({ length: 10 }, (_, i) => {
			const fid = data.p4p?.entries?.[i]?.fighterId ?? '';
			return data.fighters.find((f) => f.id === fid)?.name ?? '';
		})
	);
	let openDropdown  = $state(-1);  // which row has its dropdown open (-1 = none)

	// Build a flat fighter list for the dropdown — include flag + org info
	const allFighters = $derived(() => {
		return data.fighters.map((f) => {
			const nat = f.nationalities?.[0] ?? f.country ?? '';
			return {
				id: f.id,
				name: f.name,
				nat,
				orgs: f.rankings.map((r) => r.org ?? r.orgId).filter(Boolean)
			};
		});
	});

	function filteredFighters(rowIdx) {
		const q = fighterSearch[rowIdx]?.toLowerCase().trim() ?? '';
		const currentId = p4pRows[rowIdx].fighterId;
		// IDs already picked in all other slots — exclude them from this dropdown
		const usedElsewhere = new Set(
			p4pRows.filter((_, i) => i !== rowIdx).map((r) => r.fighterId).filter(Boolean)
		);
		const list = allFighters().filter((f) => !usedElsewhere.has(f.id) || f.id === currentId);
		if (!q) return list;
		return list.filter((f) =>
			f.name.toLowerCase().includes(q) ||
			f.nat.toLowerCase().includes(q)
		);
	}

	function selectFighter(rowIdx, fighter) {
		p4pRows[rowIdx].fighterId = fighter.id;
		fighterSearch[rowIdx] = fighter.name;
		openDropdown = -1;
	}

	function clearRow(rowIdx) {
		p4pRows[rowIdx].fighterId = '';
		fighterSearch[rowIdx] = '';
	}

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

	<!-- ── P4P Ranking tab ──────────────────────────────────────────────────── -->
	{:else if activeTab === 'p4p'}
		{#if form?.action === 'p4p'}
			{#if form.success}
				<StatusMessage type="success" message="P4P Ranking saved." />
			{:else}
				<StatusMessage type="error" message={form.message ?? 'Save failed.'} />
			{/if}
		{/if}

		<div class="panel">
			<div class="panel-header">
				<span class="panel-title">P4P World Ranking</span>
				{#if data.p4p?.updatedAt}
					<span class="p4p-updated">
						Last saved by <strong>{data.p4p.updatedBy}</strong>
						on {new Date(data.p4p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
					</span>
				{/if}
			</div>
			<p class="workflow-note">Up to 10 fighters. Select from existing fighter records. Leave rows empty to omit them from the published ranking.</p>

			<form method="POST" action="?/saveP4P" class="p4p-form">
				{#each p4pRows as row, i}
					<div class="p4p-editor-row">
						<span class="p4p-num">{i + 1}</span>

						<!-- Fighter picker -->
						<div class="p4p-picker">
							<div class="picker-wrap">
								<input
									class="picker-input"
									type="text"
									placeholder="Search fighter…"
									bind:value={fighterSearch[i]}
									onfocus={() => { openDropdown = i; }}
									oninput={() => { openDropdown = i; }}
									onfocusout={(e) => {
										if (!e.currentTarget.closest('.picker-wrap')?.contains(e.relatedTarget)) {
											openDropdown = -1;
										}
									}}
									autocomplete="off"
								/>
								{#if row.fighterId}
									<button
										type="button"
										class="picker-clear"
										tabindex="-1"
										onmousedown={(e) => { e.preventDefault(); clearRow(i); }}
										aria-label="Clear"
									>×</button>
								{/if}
							</div>
							{#if openDropdown === i}
								<ul class="picker-list">
									{#each filteredFighters(i) as f (f.id)}
										<li>
											<button
												type="button"
												class="picker-option"
												class:is-selected={row.fighterId === f.id}
												onmousedown={(e) => { e.preventDefault(); selectFighter(i, f); }}
											>
												<span class="picker-name">{f.name}</span>
												{#if f.orgs.length}
													<span class="picker-org">{f.orgs.join(' · ')}</span>
												{/if}
												{#if f.nat}<span class="picker-nat">{f.nat}</span>{/if}
											</button>
										</li>
									{/each}
									{#if filteredFighters(i).length === 0}
										<li class="picker-empty">No fighters found</li>
									{/if}
								</ul>
							{/if}
						</div>

						<!-- Hidden fighter id field -->
						<input type="hidden" name="fighter_{i + 1}" value={row.fighterId} />

						<!-- Note field -->
						<input
							class="p4p-note-input"
							type="text"
							name="note_{i + 1}"
							placeholder="Note (optional)"
							bind:value={row.note}
							maxlength="120"
						/>
					</div>
				{/each}

				<div class="p4p-save-row">
					<button type="submit" class="btn-save">Save P4P Ranking</button>
				</div>
			</form>
		</div>

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

	<!-- ── Announcement tab ──────────────────────────────────────────────────── -->
	{:else if activeTab === 'announcement'}
		{#if form?.action === 'announcement'}
			{#if form.success}
				<StatusMessage type="success" message="Announcement saved." />
			{:else}
				<StatusMessage type="error" message={form.message} />
			{/if}
		{/if}

		<div class="panel">
			<div class="panel-header">
				<span class="panel-title">Current Announcement</span>
			</div>
			<p class="workflow-note">
				This text scrolls as a banner on the home page for logged-in users. Save an empty field to disable the banner.
			</p>
			<form method="POST" action="?/saveAnnouncement" class="ann-form">
				<label class="ann-label" for="ann-text">Announcement text</label>
				<textarea
					id="ann-text"
					name="text"
					rows="3"
					class="ann-textarea"
					placeholder="e.g. Fight of the Month: Saenchai vs. Superlek — 15 July"
				>{data.announcement?.text ?? ''}</textarea>
				<button type="submit" class="btn-save">Save</button>
			</form>
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

	/* ── announcement form ── */
	.ann-form {
		display: grid;
		gap: 0.75rem;
	}

	.ann-label {
		color: #d6a33d;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.ann-textarea {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		border-radius: 6px;
		color: #f4efe4;
		font: inherit;
		line-height: 1.6;
		min-height: 4.5rem;
		padding: 0.6rem 0.75rem;
		resize: vertical;
		width: 100%;
	}

	.ann-textarea:focus {
		border-color: #d6a33d;
		outline: none;
	}

	/* ── P4P editor ── */
	.p4p-updated {
		color: #7a7062;
		font-size: 0.8rem;
	}

	.p4p-updated strong { color: #bdb4a1; }

	.p4p-form {
		display: grid;
		gap: 0.5rem;
	}

	.p4p-editor-row {
		align-items: center;
		display: grid;
		gap: 0.6rem;
		grid-template-columns: 2rem 1fr 1fr;
	}

	.p4p-num {
		color: #d6a33d;
		font-size: 1rem;
		font-weight: 700;
		text-align: right;
	}

	/* Fighter picker */
	.p4p-picker {
		position: relative;
	}

	.picker-wrap {
		align-items: center;
		display: flex;
		position: relative;
	}

	.picker-input {
		flex: 1;
		padding-right: 1.8rem !important;
	}

	.picker-clear {
		background: transparent;
		border: none;
		color: #7a7062;
		cursor: pointer;
		font: inherit;
		font-size: 1rem;
		line-height: 1;
		min-height: unset;
		padding: 0 0.25rem;
		position: absolute;
		right: 0.3rem;
	}

	.picker-clear:hover { color: #f4efe4; }

	.picker-list {
		background: #111111;
		border: 1px solid #3a321f;
		border-radius: 5px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		left: 0;
		list-style: none;
		margin: 0;
		max-height: 250px;
		overflow-y: auto;
		padding: 0.2rem 0;
		position: absolute;
		top: calc(100% + 2px);
		width: 100%;
		z-index: 200;
	}

	.picker-option {
		align-items: baseline;
		background: transparent;
		border: none;
		border-radius: 0;
		color: #f4efe4;
		cursor: pointer;
		display: flex;
		flex-wrap: wrap;
		font: inherit;
		font-size: 0.85rem;
		gap: 0.4rem;
		min-height: unset;
		padding: 0.35rem 0.75rem;
		text-align: left;
		width: 100%;
	}

	.picker-option:hover,
	.picker-option.is-selected { background: #1e1c14; }
	.picker-option.is-selected { color: #d6a33d; }

	.picker-name { font-weight: 600; }

	.picker-org {
		color: #7a7062;
		font-size: 0.75rem;
	}

	.picker-nat {
		color: #a09070;
		font-size: 0.75rem;
		margin-left: auto;
	}

	.picker-empty {
		color: #7a7062;
		font-size: 0.82rem;
		padding: 0.5rem 0.75rem;
	}

	.p4p-note-input {
		font-size: 0.85rem !important;
	}

	.p4p-save-row {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}
</style>
