import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	getOrganisationsCollection,
	getFightersCollection,
	getRankingsCollection
} from '$lib/server/db.js';
import {
	parseOrganisations,
	parseFighters,
	parseRankings,
	normalizeForDedup
} from '$lib/server/xmlParser.js';

const RWS_XML = join(process.cwd(), 'static', 'data', 'rws_rankings.xml');

// ── sync ──────────────────────────────────────────────────────────────────────

const syncToMongo = async (xml) => {
	const organisations = parseOrganisations(xml);
	const fighters = parseFighters(xml);
	const rankings = parseRankings(xml);

	const orgsCol = await getOrganisationsCollection();
	const fightersCol = await getFightersCollection();
	const rankingsCol = await getRankingsCollection();

	for (const org of organisations) {
		await orgsCol.replaceOne({ _id: org._id }, org, { upsert: true });
	}

	// ── Fighter dedup + upsert ─────────────────────────────────────────────────
	// idMap: XML id → canonical MongoDB _id. When a fighter already exists under
	// the other org's prefix (e.g. "fighter-emerson-bento" matched via normalizedName)
	// ranking entries are attached to the canonical document instead.
	const idMap = new Map();

	for (const fighter of fighters) {
		const normalized = normalizeForDedup(fighter.name);

		// Search by own _id (re-sync), normalizedName (cross-org match), or alias
		const existing = await fightersCol.findOne({
			$or: [{ _id: fighter._id }, { normalizedName: normalized }, { aliases: fighter._id }]
		});

		if (existing) {
			idMap.set(fighter._id, existing._id);
			await fightersCol.updateOne(
				{ _id: existing._id },
				{
					$addToSet: { aliases: fighter._id },
					$set: {
						normalizedName: normalizeForDedup(existing.name),
						...(fighter.nationalities?.length && { nationalities: fighter.nationalities }),
						...(fighter.age != null && { age: fighter.age }),
						...(fighter.record && { record: fighter.record })
					}
				}
			);
		} else {
			idMap.set(fighter._id, fighter._id);
			await fightersCol.replaceOne(
				{ _id: fighter._id },
				{ ...fighter, normalizedName: normalized, aliases: [fighter._id] },
				{ upsert: true }
			);
		}
	}

	// ── Rankings upsert ────────────────────────────────────────────────────────
	for (const ranking of rankings) {
		await rankingsCol.replaceOne(
			{ organisationId: ranking.organisationId, weightClassId: ranking.weightClassId },
			ranking,
			{ upsert: true }
		);
	}

	// ── Embed rankings on canonical fighter documents ──────────────────────────
	// $pull removes stale entries for this org; $addToSet writes the current ones.
	// Entries from the other org are never touched.
	const org = organisations[0];
	const orgId = org?._id;
	const orgName = org?.name ?? orgId ?? '';
	const wcByClassId = new Map(
		organisations.flatMap((o) => o.weightClasses.map((wc) => [wc.id, wc.name]))
	);

	const fighterRankingsMap = new Map();
	for (const ranking of rankings) {
		const weightClassName = wcByClassId.get(ranking.weightClassId) ?? '';
		for (const entry of ranking.entries) {
			const canonicalId = idMap.get(entry.fighterId) ?? entry.fighterId;
			if (!fighterRankingsMap.has(canonicalId)) fighterRankingsMap.set(canonicalId, []);
			fighterRankingsMap.get(canonicalId).push({
				orgId,
				org: orgName,
				weightClassId: ranking.weightClassId,
				weightClassName,
				position: entry.position
			});
		}
	}

	if (orgId) {
		await fightersCol.updateMany({}, { $pull: { rankings: { orgId } } });
	}
	for (const [canonicalId, entries] of fighterRankingsMap) {
		await fightersCol.updateOne(
			{ _id: canonicalId },
			{ $addToSet: { rankings: { $each: entries } } }
		);
	}

	return { fighters: fighters.length, rankings: rankings.length };
};

// ── handler ───────────────────────────────────────────────────────────────────

export const POST = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorised.' }, { status: 401 });
	if (locals.user.role !== 'admin') return json({ error: 'Forbidden.' }, { status: 403 });

	let xml;
	try {
		xml = await readFile(RWS_XML, 'utf-8');
	} catch (err) {
		console.error('[scrape/rws] Failed to read XML file:', { path: RWS_XML, message: err.message });
		return json({ error: `Failed to read XML: ${err.message}` }, { status: 500 });
	}

	let counts;
	try {
		counts = await syncToMongo(xml);
	} catch (err) {
		console.error('[scrape/rws] MongoDB sync failed:', err);
		return json({ error: `Database sync failed: ${err.message}` }, { status: 500 });
	}

	return json({
		success: true,
		updatedAt: new Date().toISOString().slice(0, 10),
		fighters: counts.fighters,
		rankings: counts.rankings
	});
};
