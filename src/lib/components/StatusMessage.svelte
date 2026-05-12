<script>
	let { type = 'info', message } = $props();

	const supportedTypes = ['info', 'success', 'warning', 'error'];
	const statusType = $derived(supportedTypes.includes(type) ? type : 'info');
</script>

{#if message}
	<p class={`status ${statusType}`} role={statusType === 'error' ? 'alert' : 'status'}>
		{message}
	</p>
{/if}

<style>
	.status {
		border: 1px solid;
		border-radius: 8px;
		line-height: 1.5;
		margin: 0;
		padding: 0.8rem 1rem;
	}

	.info {
		background: #172230;
		border-color: #2f6d9b;
		color: #cde9ff;
	}

	.success {
		background: #142719;
		border-color: #3a8b4b;
		color: #d7f8dd;
	}

	.warning {
		background: #2b2415;
		border-color: #d6a33d;
		color: #ffe5a6;
	}

	.error {
		background: #2d1515;
		border-color: #a94343;
		color: #ffd6d6;
	}
</style>
