<script>
	let { data } = $props();

	const fmt = (iso) =>
		iso
			? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
			: null;

	// ── Carousel (user view only) ──────────────────────────────────────────────
	const images = [
		'/images/carousel/carousel_banner_01.jpg',
		'/images/carousel/carousel_banner_02.jpg',
		'/images/carousel/carousel_banner_03.jpg',
		'/images/carousel/carousel_banner_04.jpg'
	];

	let current = $state(0);
	const goTo = (i) => { current = i; };

	$effect(() => {
		if (data.view !== 'user') return;
		if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const id = setInterval(() => {
			current = (current + 1) % images.length;
		}, 4000);
		return () => clearInterval(id);
	});

	const displayName = $derived(
		data.view === 'user'
			? (data.user?.firstName || data.user?.username || 'there')
			: ''
	);

	// ── Admin visualisations ───────────────────────────────────────────────────
	const CIRC = 2 * Math.PI * 40;
	const wbcFighters = $derived(data.wbcFighterCount ?? 0);
	const rwsFighters = $derived(data.rwsFighterCount ?? 0);
	const donutTotal  = $derived(wbcFighters + rwsFighters);
	const wbcArc = $derived(donutTotal > 0 ? (wbcFighters / donutTotal) * CIRC : 0);
	const rwsArc = $derived(donutTotal > 0 ? (rwsFighters / donutTotal) * CIRC : 0);

	function timeAgo(iso) {
		if (!iso) return 'Never synced';
		const ms = Date.now() - new Date(iso).getTime();
		const h = ms / 3_600_000;
		if (h < 1) return 'just now';
		if (h < 24) return `${Math.floor(h)}h ago`;
		const d = Math.floor(h / 24);
		if (d < 30) return `${d} day${d !== 1 ? 's' : ''} ago`;
		const mo = Math.floor(d / 30);
		return `${mo} month${mo !== 1 ? 's' : ''} ago`;
	}

	function dotColor(iso) {
		if (!iso) return '#7a7062';
		const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
		if (d < 7)  return '#4caf73';
		if (d < 30) return '#d6a33d';
		return '#e05555';
	}
</script>

<!-- ══════════════════════════════════════════════════════════════ GUEST ══ -->
{#if data.view === 'guest'}
	<section class="guest-page">
		<div class="hero">
			<h1 class="hero-title">MT Rankings</h1>
			<p class="hero-sub">WBC &amp; RWS rankings — free, no login required.</p>
		</div>

		<div class="feature-cards">
			<div class="feature-card">
				<div class="feature-icon" aria-hidden="true">
					<!-- Trophy -->
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
						<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
						<path d="M4 22h16"/>
						<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
						<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
						<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
					</svg>
				</div>
				<h2>Rankings</h2>
				<p>Browse WBC and RWS rankings by organisation and weight class.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon" aria-hidden="true">
					<!-- Person -->
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="8" r="4"/>
						<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
					</svg>
				</div>
				<h2>Fighters</h2>
				<p>View fighter profiles with nationality, age, record and ranking positions.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon" aria-hidden="true">
					<!-- Search -->
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/>
						<path d="m21 21-4.35-4.35"/>
					</svg>
				</div>
				<h2>Search</h2>
				<p>Find fighters by name and see their standings across all weight classes.</p>
			</div>
		</div>

		<div class="guest-cta">
			<p class="cta-text">Want to save your favourite fighters?</p>
			<div class="cta-buttons">
				<a href="/login" class="btn-primary">Login</a>
				<a href="/register" class="btn-secondary">Register</a>
			</div>
		</div>
	</section>

<!-- ═══════════════════════════════════════════════════════════════ USER ══ -->
{:else if data.view === 'user'}
	<!-- Banner + Carousel — full-bleed, unchanged -->
	<div class="user-media">
		{#if data.announcement}
			<div class="ann-banner" role="marquee" aria-label={data.announcement.text}>
				<div class="ann-track" aria-hidden="true">
					{#each [0,1,2,3,4,5,6,7,8,9] as _}
						<span class="ann-text">{data.announcement.text}&nbsp;·&nbsp;</span>
					{/each}
					{#each [0,1,2,3,4,5,6,7,8,9] as _}
						<span class="ann-text">{data.announcement.text}&nbsp;·&nbsp;</span>
					{/each}
				</div>
			</div>
		{/if}

		<div class="carousel" role="region" aria-label="Image carousel">
			<div class="carousel-slides">
				{#each images as src, i}
					<img {src} alt="" class:active={i === current} draggable="false" />
				{/each}
			</div>
			<div class="carousel-dots" role="tablist" aria-label="Carousel navigation">
				{#each images as _, i}
					<button
						role="tab"
						aria-selected={i === current}
						aria-label="Slide {i + 1}"
						class:active={i === current}
						onclick={() => goTo(i)}
					></button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Content area — inside main's padding -->
	<section class="user-content">
		<!-- Welcome -->
		<div class="welcome">
			<h1 class="welcome-title">Welcome back, {displayName}</h1>
			{#if data.lastSync}
				<p class="sync-ts">Last data sync: {fmt(data.lastSync)}</p>
			{/if}
		</div>

		<!-- Favourites -->
		<div class="content-section">
			<h2 class="section-title">Your favourites</h2>
			{#if data.recentFavorites?.length > 0}
				<div class="fav-grid">
					{#each data.recentFavorites as fav}
						<a href={`/fighters/${fav.id}`} class="fav-card">
							{#if fav.country}
								<span class="fav-country">{fav.country}</span>
							{/if}
							<span class="fav-name">{fav.name}</span>
						</a>
					{/each}
				</div>
			{:else}
				<a href="/fighters" class="fav-empty">
					<span class="fav-empty-plus" aria-hidden="true">+</span>
					<span>Add favourite</span>
				</a>
			{/if}
		</div>

		<!-- Action cards -->
		<div class="action-grid">
			<a href="/rankings" class="action-card">
				<span class="action-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
						<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
						<path d="M4 22h16"/>
						<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
						<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
						<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
					</svg>
				</span>
				<span class="action-text">
					<span class="action-title">Rankings</span>
					<span class="action-desc">Browse WBC and RWS rankings</span>
				</span>
				<span class="action-arrow" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
				</span>
			</a>

			<a href="/fighters" class="action-card">
				<span class="action-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="8" r="4"/>
						<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
					</svg>
				</span>
				<span class="action-text">
					<span class="action-title">Find fighters</span>
					<span class="action-desc">Search and explore fighter profiles</span>
				</span>
				<span class="action-arrow" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
				</span>
			</a>
		</div>
	</section>

<!-- ════════════════════════════════════════════════════════════ ADMIN ══ -->
{:else}
	<section class="admin-page">
		<div class="admin-header">
			<h1>Admin Dashboard</h1>
			<p class="admin-sub">Overview of database state and sync status.</p>
		</div>

		<!-- ── Stat cards ── -->
		<div class="stat-cards">
			<div class="stat-card">
				<span class="stat-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
				</span>
				<span class="stat-value">{data.fighterCount}</span>
				<span class="stat-label">Fighters</span>
			</div>
			<div class="stat-card">
				<span class="stat-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="10" y1="6" x2="21" y2="6"/>
						<line x1="10" y1="12" x2="21" y2="12"/>
						<line x1="10" y1="18" x2="21" y2="18"/>
						<path d="M4 6h1v4M4 10h2"/>
						<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
					</svg>
				</span>
				<span class="stat-value">{data.rankingCount}</span>
				<span class="stat-label">Ranking lists</span>
			</div>
			<div class="stat-card">
				<span class="stat-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
				</span>
				<span class="stat-value">{data.userCount}</span>
				<span class="stat-label">Users</span>
			</div>
		</div>

		<!-- ── Donut chart ── -->
		<div class="viz-card">
			<h2 class="viz-title">Fighter distribution</h2>
			<div class="donut-row">
				<svg viewBox="0 0 120 120" class="donut-svg" role="img" aria-label="Fighter distribution by organisation">
					<!-- Background track -->
					<circle cx="60" cy="60" r="40" fill="none" stroke="#1e1c14" stroke-width="14"/>
					<!-- WBC arc -->
					{#if wbcArc > 0}
						<circle
							cx="60" cy="60" r="40"
							fill="none" stroke="#d6a33d" stroke-width="14"
							stroke-dasharray={`${wbcArc} ${CIRC}`}
							stroke-dashoffset={0}
							transform="rotate(-90 60 60)"
						/>
					{/if}
					<!-- RWS arc -->
					{#if rwsArc > 0}
						<circle
							cx="60" cy="60" r="40"
							fill="none" stroke="#5b9ecf" stroke-width="14"
							stroke-dasharray={`${rwsArc} ${CIRC}`}
							stroke-dashoffset={-wbcArc}
							transform="rotate(-90 60 60)"
						/>
					{/if}
					<!-- Center labels -->
					<text x="60" y="58" text-anchor="middle" dominant-baseline="middle" fill="#f4efe4" font-size="24" font-weight="700">{data.fighterCount}</text>
					<text x="60" y="73" text-anchor="middle" fill="#7a7062" font-size="9">fighters</text>
				</svg>

				<div class="donut-legend">
					<div class="legend-item">
						<span class="legend-dot" style="background: #d6a33d"></span>
						<span class="legend-label">WBC</span>
						<span class="legend-count">{data.wbcFighterCount ?? 0} fighters</span>
					</div>
					<div class="legend-item">
						<span class="legend-dot" style="background: #5b9ecf"></span>
						<span class="legend-label">RWS</span>
						<span class="legend-count">{data.rwsFighterCount ?? 0} fighters</span>
					</div>
					{#if (data.fighterCount ?? 0) > (data.wbcFighterCount ?? 0) + (data.rwsFighterCount ?? 0)}
						<div class="legend-item">
							<span class="legend-dot" style="background: #3a321f"></span>
							<span class="legend-label">Other</span>
							<span class="legend-count">{(data.fighterCount ?? 0) - (data.wbcFighterCount ?? 0) - (data.rwsFighterCount ?? 0)} fighters</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ── Sync timeline ── -->
		<div class="viz-card">
			<h2 class="viz-title">Sync status</h2>
			<div class="sync-timeline">
				<span class="stl-org">WBC Muay Thai</span>
				<span></span>
				<span class="stl-org stl-right">Rajadamnern WS</span>

				<div class="stl-dot stl-dot-l" style="background: {dotColor(data.wbcLastSync)}"></div>
				<div class="stl-line"></div>
				<div class="stl-dot stl-dot-r" style="background: {dotColor(data.rwsLastSync)}"></div>

				<span class="stl-ago">{timeAgo(data.wbcLastSync)}</span>
				<span></span>
				<span class="stl-ago stl-right">{timeAgo(data.rwsLastSync)}</span>
			</div>
		</div>

		<div>
			<a href="/admin" class="admin-link">Admin panel</a>
		</div>
	</section>
{/if}

<style>
	/* ── Animations ── */
	@keyframes ticker {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}

	/* ── Full-bleed wrapper: banner + carousel ── */
	.user-media {
		margin-inline: calc(-1 * clamp(1.25rem, 4vw, 3rem));
		margin-top: calc(-1 * clamp(1.25rem, 4vw, 3rem));
	}

	/* ── Announcement banner ── */
	.ann-banner {
		align-items: center;
		background: #0e0e0e;
		border-bottom: 1px solid #2b2415;
		border-top: 1px solid #2b2415;
		display: flex;
		height: 50px;
		overflow: hidden;
	}

	.ann-track {
		animation: ticker 60s linear infinite;
		display: flex;
		white-space: nowrap;
		will-change: transform;
	}

	.ann-text {
		color: #d6a33d;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		padding-right: 4rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.ann-track { animation: none; }
		.carousel img { transition: none !important; }
	}

	/* ── Carousel ── */
	.carousel {
		aspect-ratio: 3 / 1;
		overflow: hidden;
		position: relative;
	}

	.carousel-slides {
		height: 100%;
		position: relative;
		width: 100%;
	}

	.carousel-slides img {
		height: 100%;
		left: 0;
		object-fit: contain;
		opacity: 0;
		position: absolute;
		top: 0;
		transition: opacity 0.7s ease;
		width: 100%;
	}

	.carousel-slides img.active { opacity: 1; }

	.carousel-dots {
		bottom: 1rem;
		display: flex;
		gap: 0.45rem;
		left: 50%;
		position: absolute;
		transform: translateX(-50%);
		z-index: 2;
	}

	.carousel-dots button {
		background: rgba(255, 255, 255, 0.35);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		height: 9px;
		padding: 0;
		transition: background 0.2s ease, transform 0.2s ease;
		width: 9px;
	}

	.carousel-dots button:hover { background: rgba(255, 255, 255, 0.65); }
	.carousel-dots button.active { background: #d6a33d; transform: scale(1.25); }

	/* ══════════════════════════════════════════════════════ GUEST ══ */
	.guest-page {
		display: grid;
		gap: 2.5rem;
		margin: 0 auto;
		max-width: 860px;
	}

	.hero {
		display: grid;
		gap: 0.75rem;
		padding-top: 0.5rem;
		text-align: center;
	}

	.hero-title {
		color: #d6a33d;
		font-size: clamp(2rem, 5vw, 3rem);
		margin: 0;
	}

	.hero-sub {
		color: #d9d0bd;
		font-size: 1.05rem;
		line-height: 1.7;
		margin: 0;
	}

	.feature-cards {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.feature-card {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.6rem;
		padding: 1.25rem 1rem;
	}

	.feature-icon {
		color: #d6a33d;
		height: 28px;
		width: 28px;
	}

	.feature-icon svg {
		height: 100%;
		width: 100%;
	}

	.feature-card h2 {
		color: #f4efe4;
		font-size: 1rem;
		margin: 0;
	}

	.feature-card p {
		color: #bdb4a1;
		font-size: 0.88rem;
		line-height: 1.55;
		margin: 0;
	}

	.guest-cta {
		align-items: center;
		border-top: 1px solid #2b2415;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: space-between;
		padding-top: 1.5rem;
	}

	.cta-text {
		color: #bdb4a1;
		font-size: 0.95rem;
		margin: 0;
	}

	.cta-buttons {
		display: flex;
		gap: 0.65rem;
	}

	.btn-primary {
		background: #d6a33d;
		border-radius: 8px;
		color: #111111;
		font-weight: 700;
		padding: 0.6rem 1.2rem;
		text-decoration: none;
	}

	.btn-primary:hover { background: #efbf58; }

	.btn-secondary {
		background: transparent;
		border: 1px solid #3a321f;
		border-radius: 8px;
		color: #d9d0bd;
		padding: 0.6rem 1.2rem;
		text-decoration: none;
	}

	.btn-secondary:hover { border-color: #d6a33d; color: #d6a33d; }

	/* ════════════════════════════════════════════════════════ USER ══ */
	.user-content {
		display: grid;
		gap: 2rem;
		margin-top: 2rem;
		max-width: 1100px;
	}

	.welcome-title {
		color: #f4efe4;
		font-size: 1.5rem;
		margin: 0;
	}

	/* reuse .sync-ts for both admin and user */
	.sync-ts {
		color: #7a7062;
		font-size: 0.8rem;
		margin: 0.3rem 0 0;
	}

	.section-title {
		color: #d6a33d;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		margin: 0 0 0.75rem;
		text-transform: uppercase;
	}

	.fav-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.fav-card {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}

	.fav-card:hover { border-color: #d6a33d; }

	.fav-country {
		color: #7a7062;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.fav-name {
		color: #f4efe4;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.fav-empty {
		align-items: center;
		background: transparent;
		border: 1px dashed #3a321f;
		border-radius: 8px;
		color: #7a7062;
		display: inline-flex;
		font-size: 0.9rem;
		gap: 0.5rem;
		padding: 0.85rem 1.1rem;
		text-decoration: none;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.fav-empty:hover { border-color: #d6a33d; color: #d6a33d; }

	.fav-empty-plus {
		font-size: 1.25rem;
		font-weight: 300;
		line-height: 1;
	}

	.action-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.action-card {
		align-items: center;
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: flex;
		gap: 1rem;
		padding: 1rem 1.1rem;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}

	.action-card:hover { border-color: #d6a33d; }

	.action-icon {
		color: #d6a33d;
		flex-shrink: 0;
		height: 22px;
		width: 22px;
	}

	.action-icon svg {
		height: 100%;
		width: 100%;
	}

	.action-text {
		display: grid;
		flex: 1;
		gap: 0.15rem;
	}

	.action-title {
		color: #f4efe4;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.action-desc {
		color: #7a7062;
		font-size: 0.8rem;
	}

	.action-arrow {
		color: #3a321f;
		flex-shrink: 0;
		height: 18px;
		transition: color 0.15s ease;
		width: 18px;
	}

	.action-card:hover .action-arrow { color: #d6a33d; }

	.action-arrow svg {
		height: 100%;
		width: 100%;
	}

	/* ══════════════════════════════════════════════════════ ADMIN ══ */
	.admin-page {
		display: grid;
		gap: 1.25rem;
		max-width: 900px;
	}

	.admin-header h1 {
		color: #d6a33d;
		font-size: 1.7rem;
		margin: 0;
	}

	.admin-sub {
		color: #bdb4a1;
		font-size: 0.88rem;
		margin: 0.25rem 0 0;
	}

	/* Stat cards */
	.stat-cards {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.stat-card {
		align-items: flex-start;
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 0.3rem;
		padding: 1rem 1.1rem;
	}

	.stat-icon {
		color: #d6a33d;
		display: block;
		height: 24px;
		margin-bottom: 0.2rem;
		width: 24px;
	}

	.stat-icon svg {
		height: 100%;
		width: 100%;
	}

	.stat-value {
		color: #d6a33d;
		font-size: 1.9rem;
		font-weight: 700;
		line-height: 1;
	}

	.stat-label {
		color: #bdb4a1;
		font-size: 0.82rem;
	}

	/* Shared viz card */
	.viz-card {
		background: #111111;
		border: 1px solid #2b2415;
		border-radius: 8px;
		display: grid;
		gap: 1rem;
		padding: 1rem 1.1rem;
	}

	.viz-title {
		color: #d6a33d;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		margin: 0;
		text-transform: uppercase;
	}

	/* Donut chart */
	.donut-row {
		align-items: center;
		display: flex;
		gap: 2rem;
	}

	.donut-svg {
		flex-shrink: 0;
		height: 120px;
		width: 120px;
	}

	.donut-legend {
		display: grid;
		gap: 0.6rem;
	}

	.legend-item {
		align-items: center;
		display: grid;
		column-gap: 0.5rem;
		grid-template-columns: 10px auto 1fr;
	}

	.legend-dot {
		border-radius: 50%;
		height: 10px;
		width: 10px;
	}

	.legend-label {
		color: #f4efe4;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.legend-count {
		color: #7a7062;
		font-size: 0.8rem;
	}

	/* Sync timeline */
	.sync-timeline {
		align-items: center;
		display: grid;
		gap: 0.4rem 0;
		grid-template-columns: auto 1fr auto;
		padding: 0.25rem 0;
	}

	.stl-org {
		color: #bdb4a1;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.stl-right { text-align: right; }

	.stl-dot {
		border-radius: 50%;
		height: 14px;
		width: 14px;
	}

	.stl-dot-l { justify-self: end; }
	.stl-dot-r { justify-self: start; }

	.stl-line {
		background: #2b2415;
		height: 2px;
	}

	.stl-ago {
		color: #7a7062;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.admin-link {
		background: #d6a33d;
		border-radius: 8px;
		color: #111111;
		display: inline-block;
		font-weight: 700;
		padding: 0.7rem 1.2rem;
		text-decoration: none;
	}

	.admin-link:hover { background: #efbf58; }

	/* ── Responsive ── */
	@media (max-width: 700px) {
		.feature-cards,
		.stat-cards,
		.fav-grid {
			grid-template-columns: 1fr;
		}

		.action-grid {
			grid-template-columns: 1fr;
		}

		.donut-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}

	@media (min-width: 480px) and (max-width: 700px) {
		.feature-cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.fav-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
