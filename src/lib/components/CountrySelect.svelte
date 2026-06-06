<script>
	/** Searchable country dropdown — submits ISO 3166-1 alpha-2 code via hidden input. */
	let {
		name,
		value    = '',
		required = false,
		clearable = false,
		placeholder = 'Select country'
	} = $props();

	// ── Country data ───────────────────────────────────────────────────────────
	const COUNTRIES = [
		{ code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' },
		{ code: 'DZ', name: 'Algeria' }, { code: 'AD', name: 'Andorra' },
		{ code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
		{ code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
		{ code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
		{ code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
		{ code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
		{ code: 'BB', name: 'Barbados' }, { code: 'BY', name: 'Belarus' },
		{ code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
		{ code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' },
		{ code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
		{ code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
		{ code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' },
		{ code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
		{ code: 'CV', name: 'Cape Verde' }, { code: 'KH', name: 'Cambodia' },
		{ code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' },
		{ code: 'CF', name: 'Central African Republic' }, { code: 'TD', name: 'Chad' },
		{ code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
		{ code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' },
		{ code: 'CG', name: 'Congo' }, { code: 'CD', name: 'Congo (DR)' },
		{ code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
		{ code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
		{ code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
		{ code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
		{ code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' },
		{ code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' },
		{ code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
		{ code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' },
		{ code: 'SZ', name: 'Eswatini' }, { code: 'ET', name: 'Ethiopia' },
		{ code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
		{ code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' },
		{ code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' },
		{ code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
		{ code: 'GR', name: 'Greece' }, { code: 'GD', name: 'Grenada' },
		{ code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' },
		{ code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
		{ code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' },
		{ code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
		{ code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
		{ code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
		{ code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
		{ code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
		{ code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
		{ code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
		{ code: 'KI', name: 'Kiribati' }, { code: 'KP', name: 'Korea (North)' },
		{ code: 'KR', name: 'Korea (South)' }, { code: 'XK', name: 'Kosovo' },
		{ code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' },
		{ code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' },
		{ code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
		{ code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' },
		{ code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
		{ code: 'LU', name: 'Luxembourg' }, { code: 'MG', name: 'Madagascar' },
		{ code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' },
		{ code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' },
		{ code: 'MT', name: 'Malta' }, { code: 'MH', name: 'Marshall Islands' },
		{ code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' },
		{ code: 'MX', name: 'Mexico' }, { code: 'FM', name: 'Micronesia' },
		{ code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' },
		{ code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' },
		{ code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
		{ code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' },
		{ code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
		{ code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
		{ code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' },
		{ code: 'NG', name: 'Nigeria' }, { code: 'MK', name: 'North Macedonia' },
		{ code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
		{ code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' },
		{ code: 'PS', name: 'Palestine' }, { code: 'PA', name: 'Panama' },
		{ code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
		{ code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
		{ code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
		{ code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
		{ code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' },
		{ code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'LC', name: 'Saint Lucia' },
		{ code: 'VC', name: 'Saint Vincent and the Grenadines' },
		{ code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' },
		{ code: 'ST', name: 'São Tomé and Príncipe' }, { code: 'SA', name: 'Saudi Arabia' },
		{ code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
		{ code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' },
		{ code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
		{ code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' },
		{ code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' },
		{ code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' },
		{ code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' },
		{ code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
		{ code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' },
		{ code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' },
		{ code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
		{ code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' },
		{ code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad and Tobago' },
		{ code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
		{ code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' },
		{ code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' },
		{ code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
		{ code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' },
		{ code: 'UZ', name: 'Uzbekistan' }, { code: 'VU', name: 'Vanuatu' },
		{ code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
		{ code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
		{ code: 'ZW', name: 'Zimbabwe' }
	];

	function flag(code) {
		if (!code || code.length < 2) return '';
		return [...code.toUpperCase().slice(0, 2)]
			.map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
			.join('');
	}

	// Resolve a value that may be an ISO code ("TH") or a full name ("Thailand")
	function findByValue(v) {
		if (!v) return null;
		return COUNTRIES.find(c => c.code.toUpperCase() === v.toUpperCase())
			?? COUNTRIES.find(c => c.name.toLowerCase() === v.toLowerCase())
			?? null;
	}

	function displayFor(code) {
		if (!code) return '';
		const c = COUNTRIES.find(cc => cc.code === code);
		return c ? `${flag(c.code)} ${c.name}` : '';
	}

	// ── State ──────────────────────────────────────────────────────────────────
	// Normalize incoming value (may be name or code) to ISO code immediately
	const initCountry  = findByValue(value);
	let selectedCode   = $state(initCountry?.code ?? '');
	let searchText     = $state(displayFor(initCountry?.code ?? ''));
	let open           = $state(false);
	let containerEl    = $state(null);

	const selectedCountry = $derived(
		COUNTRIES.find(c => c.code === selectedCode) ?? null
	);

	// Sync display text when dropdown closes or selection changes while closed
	$effect(() => {
		if (!open) {
			searchText = selectedCountry
				? `${flag(selectedCountry.code)} ${selectedCountry.name}`
				: '';
		}
	});

	// Filtered list — matches project's $derived(() => fn) pattern; call as filtered()
	const filtered = $derived(() => {
		if (!open) return COUNTRIES;
		const raw = searchText.toLowerCase().trim();
		// Strip regional indicator chars (U+1F1E0–U+1F1FF) so typing after a flag works
		const q = raw.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
		if (!q) return COUNTRIES;
		return COUNTRIES.filter(c =>
			c.name.toLowerCase().includes(q) ||
			c.code.toLowerCase() === q
		);
	});

	// ── Handlers ───────────────────────────────────────────────────────────────
	function handleFocus() {
		searchText = '';
		open = true;
	}

	function handleInput() {
		open = true;
	}

	function handleFocusOut(e) {
		if (!containerEl?.contains(e.relatedTarget)) {
			open = false;
		}
	}

	function select(country) {
		selectedCode = country.code;
		open = false;
	}

	function clear(e) {
		e.preventDefault();
		selectedCode = '';
		open = false;
	}
</script>

<div class="cs" bind:this={containerEl} onfocusout={handleFocusOut}>
	<!-- Hidden input carries the ISO code for form submission -->
	<input type="hidden" {name} value={selectedCode} {required} />

	<!-- Visible search / display input -->
	<div class="cs-wrap">
		<input
			class="cs-input"
			class:has-clear={clearable && selectedCode}
			type="text"
			bind:value={searchText}
			{placeholder}
			onfocus={handleFocus}
			oninput={handleInput}
			autocomplete="off"
			spellcheck="false"
			role="combobox"
			aria-expanded={open}
			aria-autocomplete="list"
		/>
		{#if clearable && selectedCode}
			<button
				type="button"
				class="cs-clear"
				onmousedown={clear}
				tabindex="-1"
				aria-label="Clear selection"
			>×</button>
		{/if}
		<span class="cs-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
	</div>

	<!-- Dropdown list -->
	{#if open}
		<ul class="cs-list" role="listbox">
			{#if filtered().length === 0}
				<li class="cs-empty">No countries found</li>
			{:else}
				{#each filtered() as country (country.code)}
					<li role="option" aria-selected={country.code === selectedCode}>
						<button
							type="button"
							class="cs-option"
							class:is-selected={country.code === selectedCode}
							onmousedown={(e) => { e.preventDefault(); select(country); }}
						>
							<span class="cs-flag">{flag(country.code)}</span>
							<span class="cs-name">{country.name}</span>
							<span class="cs-code">{country.code}</span>
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>

<style>
	.cs {
		position: relative;
		width: 100%;
	}

	/* ── Input row ── */
	.cs-wrap {
		align-items: center;
		display: flex;
		position: relative;
	}

	.cs-input {
		background: #0b0b0b;
		border: 1px solid #3a321f;
		border-radius: 5px;
		color: #f4efe4;
		font: inherit;
		min-height: 2.25rem;
		padding: 0.4rem 2rem 0.4rem 0.6rem;
		width: 100%;
	}

	.cs-input.has-clear {
		padding-right: 3.2rem;
	}

	.cs-input:focus {
		border-color: #d6a33d;
		outline: none;
	}

	.cs-clear {
		background: transparent;
		border: none;
		color: #7a7062;
		cursor: pointer;
		font: inherit;
		font-size: 1rem;
		line-height: 1;
		padding: 0 0.25rem;
		position: absolute;
		right: 1.4rem;
	}

	.cs-clear:hover { color: #f4efe4; }

	.cs-chevron {
		color: #7a7062;
		font-size: 0.6rem;
		pointer-events: none;
		position: absolute;
		right: 0.5rem;
	}

	/* ── Dropdown ── */
	.cs-list {
		background: #111111;
		border: 1px solid #3a321f;
		border-radius: 5px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		left: 0;
		list-style: none;
		margin: 0;
		max-height: 220px;
		overflow-y: auto;
		padding: 0.2rem 0;
		position: absolute;
		top: calc(100% + 3px);
		width: 100%;
		z-index: 200;
	}

	.cs-empty {
		color: #7a7062;
		font-size: 0.82rem;
		padding: 0.5rem 0.75rem;
	}

	.cs-option {
		align-items: center;
		background: transparent;
		border: none;
		color: #f4efe4;
		cursor: pointer;
		display: flex;
		font: inherit;
		font-size: 0.88rem;
		gap: 0.5rem;
		padding: 0.35rem 0.75rem;
		text-align: left;
		width: 100%;
	}

	.cs-option:hover,
	.cs-option:focus-visible {
		background: #1e1c14;
		outline: none;
	}

	.cs-option.is-selected {
		background: #1e1c14;
		color: #d6a33d;
	}

	.cs-flag {
		flex-shrink: 0;
		font-size: 1rem;
		line-height: 1;
	}

	.cs-name {
		flex: 1;
	}

	.cs-code {
		color: #7a7062;
		flex-shrink: 0;
		font-size: 0.75rem;
		font-family: monospace;
	}
</style>
