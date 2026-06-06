<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data, form } = $props();
</script>

<section class="admin-page">
	<PageHeader title="Fighters" subtitle="Manage all fighter records." />

	{#if form?.message}
		<StatusMessage type="error" message={form.message} />
	{/if}
	{#if form?.success}
		<StatusMessage type="success" message="Changes saved." />
	{/if}

	{#if data.fighters.length === 0}
		<StatusMessage type="info" message="No fighters in the database. Run the seed script first." />
	{:else}
		<div class="fighter-list">
			{#each data.fighters as f}
				<div class="fighter-row">
					<form method="POST" action="?/update" class="update-form">
						<input type="hidden" name="id" value={f.id} />

						<label class="field">
							<span>Name</span>
							<input type="text" name="name" value={f.name} required />
						</label>

						<label class="field">
							<span>Country</span>
							<input type="text" name="country" value={f.country} />
						</label>

						<button type="submit" class="btn-save">Save</button>
					</form>

					<form method="POST" action="?/delete" class="delete-form">
						<input type="hidden" name="id" value={f.id} />
						<button
							type="submit"
							class="btn-delete"
							onclick={(e) => { if (!confirm('Permanently delete this fighter?')) e.preventDefault(); }}
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

	.fighter-list {
		display: grid;
		gap: 0.75rem;
	}

	.fighter-row {
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
	button {
		border-radius: 6px;
		font: inherit;
		min-height: 2.5rem;
		padding: 0.5rem 0.65rem;
	}

	input {
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
</style>
