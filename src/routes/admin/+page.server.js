import { fail } from '@sveltejs/kit';
import { getAllUsers, updateUser, deleteUser } from '$lib/server/auth.js';
import { getFightersCollection, getOrganisationsCollection } from '$lib/server/db.js';

export const load = async () => {
	const [users, fighterDocs, orgDocs] = await Promise.all([
		getAllUsers(),
		getFightersCollection().then((col) => col.find({}).sort({ name: 1 }).toArray()),
		getOrganisationsCollection().then((col) => col.find({}).toArray())
	]);

	return {
		users,
		fighters: fighterDocs.map((f) => ({
			id: f._id,
			name: f.name,
			country: f.country ?? '',
			nationalities: f.nationalities ?? [],
			rankings: f.rankings ?? []
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
		const data    = await request.formData();
		const id      = data.get('id')?.toString().trim();
		const name    = data.get('name')?.toString().trim();
		const country = data.get('country')?.toString().trim() ?? '';

		if (!id || !name) return fail(400, { action: 'updateFighter', message: 'Name is required.' });

		const col = await getFightersCollection();
		await col.updateOne({ _id: id }, { $set: { name, country } });
		return { action: 'updateFighter', success: true };
	},

	deleteFighter: async ({ request }) => {
		const data = await request.formData();
		const id   = data.get('id')?.toString().trim();
		if (!id) return fail(400, { action: 'deleteFighter', message: 'Missing fighter ID.' });

		const col = await getFightersCollection();
		await col.deleteOne({ _id: id });
		return { action: 'deleteFighter', success: true };
	}
};
