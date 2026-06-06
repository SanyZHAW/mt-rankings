<script>
	import FighterBrowser from '$lib/components/FighterBrowser.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();
</script>

<section class="fighters-page">
	<PageHeader
		title="Fighters"
		subtitle="Browse and search all ranked fighters across organisations."
	/>
	<FighterBrowser fighters={data.fighters} organisations={data.organisations} />
</section>

<style>
	.fighters-page {
		display: grid;
		gap: 1.25rem;
		max-width: 1000px;
	}
</style>
