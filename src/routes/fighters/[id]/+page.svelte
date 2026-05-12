<script>
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import FighterDetail from '$lib/components/FighterDetail.svelte';
	import FighterRankingTable from '$lib/components/FighterRankingTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';

	let { data, form } = $props();
</script>

<section class="fighter-page">
	<a class="back-link" href="/rankings">Back to rankings</a>

	{#if data.validationErrors.length > 0}
		<StatusMessage
			type="error"
			message="The XML ranking data contains invalid references. Please check the parser output."
		/>
	{/if}

	{#if form?.message}
		<StatusMessage type={form.message.includes('saved') ? 'success' : 'warning'} message={form.message} />
	{/if}

	{#if data.fighter}
		<PageHeader
			title={data.fighter.name}
			subtitle="Fighter profile and ranking appearances across organisations."
		/>

		<div class="content-grid">
			<div class="main-content">
				<FighterDetail fighter={data.fighter} />
				<FighterRankingTable rankingEntries={data.rankingEntries} />
			</div>

			<aside>
				<FavoriteButton isLoggedIn={Boolean(data.user)} isFavorite={data.isFavorite} />
			</aside>
		</div>
	{:else}
		<PageHeader title="Fighter not found" subtitle="No fighter exists for this ID in the XML data." />
		<StatusMessage
			type="warning"
			message={`Unknown fighter ID: ${data.fighterId}. Return to the rankings page and choose a listed fighter.`}
		/>
	{/if}
</section>

<style>
	.fighter-page {
		display: grid;
		gap: 1.5rem;
		max-width: 1100px;
	}

	.back-link {
		color: #d6a33d;
		font-weight: 700;
		text-decoration: none;
		width: fit-content;
	}

	.back-link:hover {
		color: #efbf58;
	}

	.content-grid {
		align-items: start;
		display: grid;
		gap: 1.25rem;
		grid-template-columns: minmax(0, 1fr) 18rem;
	}

	.main-content {
		display: grid;
		gap: 1.25rem;
	}

	@media (max-width: 850px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
