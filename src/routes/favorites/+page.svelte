<script>
	import FighterCard from '$lib/components/FighterCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data, form } = $props();
</script>

<section class="favorites-page">
	<PageHeader
		title="Favorites"
		subtitle="Your saved fighters are shown as cards because favorites have no ranking order."
	/>

	{#if form?.message}
		<StatusMessage type="success" message={form.message} />
	{/if}

	{#if data.fighters.length > 0}
		<div class="cards">
			{#each data.fighters as fighter}
				<FighterCard {fighter} showRemove />
			{/each}
		</div>
	{:else}
		<StatusMessage
			type="info"
			message="No favorites yet. Open a fighter detail page and save a fighter to build your list."
		/>
	{/if}
</section>

<style>
	.favorites-page {
		display: grid;
		gap: 1.5rem;
		max-width: 1100px;
	}

	.cards {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 900px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
