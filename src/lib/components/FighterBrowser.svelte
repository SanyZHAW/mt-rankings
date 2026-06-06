<script>
	import CountrySelect from '$lib/components/CountrySelect.svelte';

	/**
	 * Reusable fighter search / filter / sort list.
	 * isAdmin=true adds inline edit + delete forms.
	 */
	let { fighters = [], organisations = [], isAdmin = false, form = null } = $props();

	// ── filter / sort state ────────────────────────────────────────────────────
	let search      = $state('');
	let orgFilter   = $state('');
	let wcFilter    = $state('');
	let sortBy      = $state('name');

	// ── admin inline-edit state ────────────────────────────────────────────────
	let editingId   = $state(null);

	$effect(() => {
		if (form?.action === 'updateFighter' && form?.success) editingId = null;
	});

	// ── derived filter options ────────────────────────────────────────────────
	const availableOrgs = $derived(
		organisations.filter((o) => fighters.some((f) => f.rankings.some((r) => r.orgId === o.id)))
	);

	const availableWeightClasses = $derived(() => {
		const org = organisations.find((o) => o.id === orgFilter);
		const wcs = org
			? org.weightClasses
			: organisations.flatMap((o) => o.weightClasses);
		// Only show WCs that at least one fighter is actually ranked in
		return wcs.filter((wc) =>
			fighters.some((f) => f.rankings.some((r) => r.weightClassId === wc.id))
		);
	});

	// ── filtering ─────────────────────────────────────────────────────────────
	const positionScore = (fighter) => {
		const relevant = fighter.rankings.filter((r) => {
			if (orgFilter && r.orgId !== orgFilter) return false;
			if (wcFilter  && r.weightClassId !== wcFilter) return false;
			return true;
		});
		if (!relevant.length) return Infinity;
		return Math.min(...relevant.map((r) => {
			if (r.position === 'World Champion') return 0;
			const n = Number(r.position);
			return Number.isNaN(n) ? 999 : n;
		}));
	};

	const rankingSummary = (fighter) => {
		if (!fighter.rankings.length) return '';
		return fighter.rankings
			.map((r) => {
				const pos = r.position === 'World Champion' ? 'Champion' : `#${r.position}`;
				return `${r.org} ${pos}`;
			})
			.join(' · ');
	};

	const filtered = $derived(() => {
		const q = search.trim().toLowerCase();
		return fighters
			.filter((f) => {
				if (q && !f.name.toLowerCase().includes(q)) return false;
				if (orgFilter && !f.rankings.some((r) => r.orgId === orgFilter)) return false;
				if (wcFilter  && !f.rankings.some((r) => r.weightClassId === wcFilter)) return false;
				return true;
			})
			.sort((a, b) => {
				if (sortBy === 'position') {
					const diff = positionScore(a) - positionScore(b);
					if (diff !== 0) return diff;
				}
				return a.name.localeCompare(b.name);
			});
	});

	const onOrgChange = () => { wcFilter = ''; };
</script>

<!-- ── filter bar ──────────────────────────────────────────────────────────── -->
<div class="filter-bar">
	<input
		class="search-input"
		type="search"
		placeholder="Search by name…"
		bind:value={search}
		aria-label="Search fighters"
	/>

	<select bind:value={orgFilter} onchange={onOrgChange} aria-label="Filter by organisation">
		<option value="">All organisations</option>
		{#each availableOrgs as org}
			<option value={org.id}>{org.name}</option>
		{/each}
	</select>

	<select bind:value={wcFilter} aria-label="Filter by weight class">
		<option value="">All weight classes</option>
		{#each availableWeightClasses() as wc}
			<option value={wc.id}>{wc.name}</option>
		{/each}
	</select>

	<select bind:value={sortBy} aria-label="Sort by">
		<option value="name">Sort: Name</option>
		<option value="position">Sort: Ranking</option>
	</select>
</div>

<p class="result-count">{filtered().length} fighter{filtered().length === 1 ? '' : 's'}</p>

<!-- ── list ───────────────────────────────────────────────────────────────── -->
{#if filtered().length === 0}
	<p class="empty">No fighters match the current filters.</p>
{:else}
	<div class="fighter-list" role="list">
		{#each filtered() as f (f.id)}
			<div class="fighter-item" role="listitem">
				{#if isAdmin && editingId === f.id}
					<!-- ── inline edit form (admin) ── -->
					<form method="POST" action="?/updateFighter" class="edit-form">
						<input type="hidden" name="id" value={f.id} />
						<label class="edit-field">
							<span>Name</span>
							<input type="text" name="name" value={f.name} required />
						</label>
						<div class="edit-field">
							<span class="edit-label">Primary nationality</span>
							<CountrySelect
								name="nat1"
								value={f.nationalities?.[0] ?? f.country ?? ''}
								required
								placeholder="Select country"
							/>
						</div>
						<div class="edit-field">
							<span class="edit-label">Second nationality <em>optional</em></span>
							<CountrySelect
								name="nat2"
								value={f.nationalities?.[1] ?? ''}
								clearable
								placeholder="None"
							/>
						</div>
						<label class="edit-field edit-field-sm">
							<span>Age</span>
							<input
								type="number"
								name="age"
								value={f.age ?? ''}
								min="1"
								placeholder="—"
							/>
						</label>
						<label class="edit-field edit-field-sm">
							<span>Record</span>
							<input
								type="text"
								name="record"
								value={f.record ?? ''}
								placeholder="W-L-D"
							/>
						</label>
						<div class="edit-actions">
							<button type="submit" class="btn-save">Save</button>
							<button type="button" class="btn-cancel" onclick={() => { editingId = null; }}>Cancel</button>
						</div>
					</form>
				{:else}
					<!-- ── normal row ── -->
					<a class="fighter-link" href="/fighters/{f.id}">
						<span class="fighter-name">{f.name}</span>
						<span class="fighter-country">{f.nationalities?.[0] ?? f.country ?? '—'}</span>
					</a>
					<span class="fighter-rankings">{rankingSummary(f)}</span>
					{#if isAdmin}
						<div class="row-actions">
							<button
								type="button"
								class="btn-edit"
								onclick={() => { editingId = f.id; }}
							>Edit</button>
							<form method="POST" action="?/deleteFighter" class="inline-delete">
								<input type="hidden" name="id" value={f.id} />
								<button
									type="submit"
									class="btn-delete"
									onclick={(e) => { if (!confirm('Delete this fighter?')) e.preventDefault(); }}
								>Delete</button>
							</form>
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	/* ── filter bar ── */
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.search-input {
		flex: 1 1 200px;
	}

	input[type='search'],
	select {
		background: #111111;
		border: 1px solid #3a321f;
		border-radius: 6px;
		color: #f4efe4;
		font: inherit;
		min-height: 2.25rem;
		padding: 0.4rem 0.65rem;
	}

	select {
		flex: 1 1 160px;
	}

	/* ── meta ── */
	.result-count {
		color: #7a7060;
		font-size: 0.8rem;
		margin: 0;
	}

	.empty {
		color: #7a7060;
		margin: 0;
	}

	/* ── list ── */
	.fighter-list {
		display: grid;
		gap: 0.45rem;
	}

	.fighter-item {
		align-items: center;
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.5rem 1rem;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr) auto;
		padding: 0.7rem 0.9rem;
	}

	/* ── normal row ── */
	.fighter-link {
		display: grid;
		gap: 0.1rem;
		text-decoration: none;
	}

	.fighter-link:hover .fighter-name {
		color: #d6a33d;
	}

	.fighter-name {
		color: #f4efe4;
		font-weight: 600;
	}

	.fighter-country {
		color: #7a7060;
		font-size: 0.8rem;
	}

	.fighter-rankings {
		color: #bdb4a1;
		font-size: 0.82rem;
	}

	.row-actions {
		display: flex;
		gap: 0.4rem;
	}

	/* ── admin buttons ── */
	.btn-edit {
		background: transparent;
		border: 1px solid #3a321f;
		border-radius: 5px;
		color: #bdb4a1;
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		padding: 0.25rem 0.6rem;
		white-space: nowrap;
	}

	.btn-edit:hover {
		border-color: #d6a33d;
		color: #d6a33d;
	}

	.inline-delete {
		margin: 0;
	}

	.btn-delete {
		background: transparent;
		border: 1px solid #7a2020;
		border-radius: 5px;
		color: #e05555;
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		padding: 0.25rem 0.6rem;
		white-space: nowrap;
	}

	.btn-delete:hover {
		background: #7a2020;
		color: #f4efe4;
	}

	/* ── inline edit form ── */
	.edit-form {
		align-items: flex-end;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		grid-column: 1 / -1;
	}

	.edit-field {
		display: grid;
		flex: 1 1 160px;
		gap: 0.25rem;
	}

	.edit-field-sm {
		flex: 0 1 110px;
	}

	.edit-field span,
	.edit-label {
		color: #d6a33d;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.edit-field span em,
	.edit-label em {
		color: #7a7062;
		font-style: normal;
		font-weight: 400;
		text-transform: none;
	}

	.edit-field input {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		border-radius: 5px;
		color: #f4efe4;
		font: inherit;
		min-height: 2.25rem;
		padding: 0.4rem 0.6rem;
	}

	.edit-actions {
		display: flex;
		gap: 0.4rem;
	}

	.btn-save {
		background: #d6a33d;
		border: 0;
		border-radius: 5px;
		color: #111111;
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		min-height: 2.25rem;
		padding: 0.3rem 0.75rem;
		white-space: nowrap;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid #3a321f;
		border-radius: 5px;
		color: #bdb4a1;
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		min-height: 2.25rem;
		padding: 0.3rem 0.6rem;
		white-space: nowrap;
	}

	/* ── responsive ── */
	@media (max-width: 640px) {
		.fighter-item {
			grid-template-columns: 1fr;
		}

		.fighter-rankings {
			font-size: 0.78rem;
		}
	}
</style>
