/**
 * Step 9 verification script.
 * Runs standalone with `node scripts/test-step9.mjs` (no dev server needed).
 * Reads DB_URI / DB_NAME from the project .env file.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

// ── load .env ─────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env');
const env = Object.fromEntries(
	readFileSync(envPath, 'utf-8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
		.map((l) => {
			const idx = l.indexOf('=');
			return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
		})
);

const DB_URI = env.DB_URI;
const DB_NAME = env.DB_NAME || 'mt-rankings';

if (!DB_URI || DB_URI === 'your-mongodb-connection-string') {
	console.error('ERROR: DB_URI not set in .env');
	process.exit(1);
}

// ── helpers ───────────────────────────────────────────────────────────────────

const print = (label, doc) => {
	console.log('\n' + '═'.repeat(60));
	console.log(` ${label}`);
	console.log('═'.repeat(60));
	if (!doc) {
		console.log('  ⚠  NOT FOUND');
		return;
	}
	// Summarise the key fields rather than dumping everything
	console.log('  _id           :', doc._id);
	console.log('  name          :', doc.name);
	console.log('  normalizedName:', doc.normalizedName ?? '(missing)');
	console.log('  country       :', doc.country ?? '–');
	console.log('  nationalities :', JSON.stringify(doc.nationalities ?? []));
	console.log('  aliases       :', JSON.stringify(doc.aliases ?? []));
	console.log('  age           :', doc.age ?? '–');
	console.log('  record        :', doc.record ?? '–');
	console.log('  rankings      :');
	if (!doc.rankings?.length) {
		console.log('    (empty)');
	} else {
		for (const r of doc.rankings) {
			console.log(`    [${r.orgId}]  ${r.org}  |  ${r.weightClassName}  |  pos: ${r.position}`);
		}
	}
};

// ── main ─────────────────────────────────────────────────────────────────────

const client = new MongoClient(DB_URI);

try {
	await client.connect();
	const db = client.db(DB_NAME);
	const fighters = db.collection('fighters');

	// 1. Emerson Bento — cross-org dedup check
	const emerson = await fighters.findOne({
		$or: [{ _id: 'fighter-emerson-bento' }, { aliases: 'rws-emerson-bento' }]
	});
	print('Emerson Bento  (cross-org dedup)', emerson);

	// aliases validation
	const hasWbcAlias = emerson?.aliases?.includes('fighter-emerson-bento');
	const hasRwsAlias = emerson?.aliases?.includes('rws-emerson-bento');
	const hasWbcRanking = emerson?.rankings?.some((r) => r.orgId === 'org-wbc');
	const hasRwsRanking = emerson?.rankings?.some((r) => r.orgId === 'org-rws');
	console.log('\n  Checks:');
	console.log('  aliases has fighter-emerson-bento :', hasWbcAlias ? '✓' : '✗ FAIL');
	console.log('  aliases has rws-emerson-bento     :', hasRwsAlias ? '✓' : '✗ FAIL');
	console.log('  rankings has org-wbc entry        :', hasWbcRanking ? '✓' : '✗ FAIL');
	console.log('  rankings has org-rws entry        :', hasRwsRanking ? '✓' : '✗ FAIL');

	// 2. Hercules Best Chaouad — nationality check
	const hercules = await fighters.findOne({
		$or: [
			{ _id: 'fighter-hercules-best-chaouad' },
			{ normalizedName: 'herculesbestchaouad' }
		]
	});
	print('Hercules Best Chaouad  (nationality)', hercules);
	const hNats = hercules?.nationalities ?? [];
	const hasThailand = hNats.some((n) => n === 'TH' || n.toLowerCase() === 'thailand');
	const hasFrance = hNats.some((n) => n === 'FR' || n.toLowerCase() === 'france');
	console.log('\n  Checks:');
	console.log('  nationalities NOT Thailand        :', !hasThailand ? '✓' : '✗ FAIL (still shows TH)');
	console.log('  nationalities includes France     :', hasFrance ? '✓' : '✗ FAIL');

	// 3. Niall McGreevy — basic ranking check
	const niall = await fighters.findOne({
		$or: [{ _id: 'fighter-niall-mcgreevy' }, { normalizedName: 'niallmcgreevy' }]
	});
	print('Niall McGreevy  (WBC rankings)', niall);
	const niallHasRanking = (niall?.rankings?.length ?? 0) > 0;
	console.log('\n  Checks:');
	console.log('  has at least one ranking entry    :', niallHasRanking ? '✓' : '✗ FAIL');

	// 4. Alias lookup — rws-emerson-bento should resolve to the canonical doc
	const byAlias = await fighters.findOne({ aliases: 'rws-emerson-bento' });
	console.log('\n' + '═'.repeat(60));
	console.log(' Alias resolution: rws-emerson-bento → ?');
	console.log('═'.repeat(60));
	console.log('  canonical _id  :', byAlias?._id ?? 'NOT FOUND');
	console.log('  Checks:');
	console.log(
		'  resolves to fighter-emerson-bento :',
		byAlias?._id === 'fighter-emerson-bento' ? '✓' : '✗ FAIL'
	);

	console.log('\n' + '═'.repeat(60));
	console.log(' Done. ✓ = pass, ✗ = investigate.');
	console.log('═'.repeat(60) + '\n');
} finally {
	await client.close();
}
