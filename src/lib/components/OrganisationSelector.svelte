<script>
	let { organisations = [], selectedOrganisationId = '' } = $props();
</script>

<form class="selector" method="GET" action="/rankings">
	<label for="organisation">Organisation</label>
	<select id="organisation" name="organisation" value={selectedOrganisationId}>
		<option value="">Select organisation</option>
		{#each organisations as organisation}
			<option value={organisation.id}>{organisation.name}</option>
		{/each}
	</select>
	<button type="submit">Choose organisation</button>
</form>

<style>
	.selector {
		background: #141414;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
	}

	label {
		color: #d6a33d;
		font-weight: 700;
	}

	select,
	button {
		border-radius: 8px;
		font: inherit;
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
	}

	select {
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

	button:hover {
		background: #efbf58;
	}
</style>
