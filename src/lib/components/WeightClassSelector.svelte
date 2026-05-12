<script>
	let {
		organisationId,
		weightClasses = [],
		selectedWeightClassId = ''
	} = $props();
</script>

<form class="selector" method="GET" action="/rankings">
	<input type="hidden" name="organisation" value={organisationId} />

	<label for="weightClass">Weight class</label>
	<select id="weightClass" name="weightClass" value={selectedWeightClassId}>
		<option value="">Select weight class</option>
		{#each weightClasses as weightClass}
			<option value={weightClass.id}>{weightClass.name}</option>
		{/each}
	</select>
	<button type="submit">Show ranking</button>
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
