<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusMessage from '$lib/components/StatusMessage.svelte';
</script>

<section class="home">
	<PageHeader
		title="MT Rankings"
		subtitle="A prototype for comparing Muay Thai rankings across organisations."
	/>

	<div class="intro">
		<p>
			Muay Thai rankings are not always easy to compare. Organisations such as RWS and WBC
			Muay Thai use their own weight classes, ranking positions, and title structures.
		</p>
		<p>
			MT Rankings helps users follow a simple workflow: select an organisation, choose a weight
			class, view the ranking list, and open fighter details.
		</p>
	</div>

	<StatusMessage
		type="info"
		message="Fighter and ranking data currently comes from a manually maintained XML file for this prototype."
	/>

	<div class="workflow">
		<div>
			<h2>Explore rankings</h2>
			<p>Start with an organisation, then narrow the ranking by weight class.</p>
		</div>
		<div>
			<h2>Save favorites later</h2>
			<p>Logged-in users will be able to save fighters as personal favorites.</p>
		</div>
	</div>

	<a class="cta" href="/rankings">View rankings</a>
</section>

<style>
	.home {
		display: grid;
		gap: 1.5rem;
		max-width: 900px;
	}

	.intro {
		color: #d9d0bd;
		display: grid;
		gap: 1rem;
		line-height: 1.7;
		max-width: 72ch;
	}

	p {
		margin: 0;
	}

	.workflow {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin-top: 0.5rem;
	}

	.workflow > div {
		background: #141414;
		border: 1px solid #2b2415;
		border-radius: 8px;
		padding: 1rem;
	}

	h2 {
		color: #d6a33d;
		font-size: 1.05rem;
		margin: 0 0 0.5rem;
	}

	.cta {
		align-items: center;
		background: #d6a33d;
		border-radius: 8px;
		color: #111111;
		display: inline-flex;
		font-weight: 700;
		justify-content: center;
		padding: 0.85rem 1.15rem;
		text-decoration: none;
		width: fit-content;
	}

	.cta:hover {
		background: #efbf58;
	}

	@media (max-width: 700px) {
		.workflow {
			grid-template-columns: 1fr;
		}
	}
</style>
