import { fail } from '@sveltejs/kit';
import { getAllUsers, updateUser, deleteUser } from '$lib/server/auth.js';
import { getFightersCollection, getOrganisationsCollection } from '$lib/server/db.js';
import { getCurrentAnnouncement, upsertAnnouncement } from '$lib/server/announcements.js';

export const load = async () => {
	const [users, fighterDocs, orgDocs, announcement] = await Promise.all([
		getAllUsers(),
		getFightersCollection().then((col) => col.find({}).sort({ name: 1 }).toArray()),
		getOrganisationsCollection().then((col) => col.find({}).toArray()),
		getCurrentAnnouncement()
	]);

	return {
		users,
		announcement,
		fighters: fighterDocs.map((f) => ({
			id: f._id,
			name: f.name,
			country: f.country ?? '',
			nationalities: f.nationalities ?? [],
			rankings: f.rankings ?? [],
			age: f.age ?? null,
			record: f.record ?? null
		})),
		organisations: orgDocs.map((o) => ({
			id: o._id,
			name: o.name,
			weightClasses: (o.weightClasses ?? []).map((wc) => ({ id: wc.id, name: wc.name }))
		}))
	};
};

// ── User actions ──────────────────────────────────────────────────────────────

export const actions = {
	update: async ({ request }) => {
		const data = await request.formData();
		const id    = String(data.get('id')    ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const role  = String(data.get('role')  ?? '').trim();

		if (!id)    return fail(400, { action: 'user', message: 'Missing user id.' });
		if (!email) return fail(400, { action: 'user', message: 'Email is required.' });
		if (!['user', 'admin'].includes(role)) return fail(400, { action: 'user', message: 'Invalid role.' });

		const updated = await updateUser(id, { email, role });
		if (!updated) return fail(404, { action: 'user', message: 'User not found.' });

		return { action: 'user', success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '').trim();
		if (!id) return fail(400, { action: 'user', message: 'Missing user id.' });
		await deleteUser(id);
		return { action: 'user', success: true };
	},

	// ── Fighter actions ────────────────────────────────────────────────────────

	updateFighter: async ({ request }) => {
		const data         = await request.formData();
		const id        = data.get('id')?.toString().trim();
		const name      = data.get('name')?.toString().trim();
		const nat1      = data.get('nat1')?.toString().trim() ?? '';
		const nat2      = data.get('nat2')?.toString().trim() ?? '';
		const ageRaw    = data.get('age')?.toString().trim() ?? '';
		const recordRaw = data.get('record')?.toString().trim() ?? '';

		if (!id || !name) return fail(400, { action: 'updateFighter', message: 'Name is required.' });
		if (!nat1) return fail(400, { action: 'updateFighter', message: 'Primary nationality is required.' });

		let age = null;
		if (ageRaw !== '') {
			const n = Number(ageRaw);
			if (!Number.isInteger(n) || n <= 0) {
				return fail(400, { action: 'updateFighter', message: 'Age must be a positive integer.' });
			}
			age = n;
		}

		let record = null;
		if (recordRaw !== '') {
			if (!/^\d+-\d+-\d+$/.test(recordRaw)) {
				return fail(400, { action: 'updateFighter', message: 'Record must be in W-L-D format (e.g. 45-5-2).' });
			}
			record = recordRaw;
		}

		const nationalities = nat2 ? [nat1, nat2] : [nat1];
		const country = nat1;

		const col = await getFightersCollection();
		await col.updateOne({ _id: id }, { $set: { name, country, nationalities, age, record } });
		return { action: 'updateFighter', success: true };
	},

	deleteFighter: async ({ request }) => {
		const data = await request.formData();
		const id   = data.get('id')?.toString().trim();
		if (!id) return fail(400, { action: 'deleteFighter', message: 'Missing fighter ID.' });

		const col = await getFightersCollection();
		await col.deleteOne({ _id: id });
		return { action: 'deleteFighter', success: true };
	},

	saveAnnouncement: async ({ locals, request }) => {
		const data = await request.formData();
		const text = String(data.get('text') ?? '').trim();

		if (!text) return fail(400, { action: 'announcement', message: 'Announcement text is required.' });

		const updatedBy = locals.user?.username || locals.user?.email || 'admin';
		await upsertAnnouncement({ text, updatedBy });
		return { action: 'announcement', success: true };
	}
};
