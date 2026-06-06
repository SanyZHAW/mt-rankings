import { fail } from '@sveltejs/kit';
import { getFightersCollection } from '$lib/server/db.js';

export const load = async () => {
	const col = await getFightersCollection();
	const fighters = await col.find({}).sort({ name: 1 }).toArray();
	return {
		fighters: fighters.map((f) => ({ id: f._id, name: f.name, country: f.country ?? '' }))
	};
};

export const actions = {
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString().trim();
		const name = data.get('name')?.toString().trim();
		const country = data.get('country')?.toString().trim() ?? '';

		if (!id || !name) return fail(400, { message: 'Name is required.' });

		const col = await getFightersCollection();
		await col.updateOne({ _id: id }, { $set: { name, country } });
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString().trim();
		if (!id) return fail(400, { message: 'Missing fighter ID.' });

		const col = await getFightersCollection();
		await col.deleteOne({ _id: id });
		return { success: true };
	}
};
