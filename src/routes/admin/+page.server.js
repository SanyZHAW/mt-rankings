import { fail } from '@sveltejs/kit';
import { getAllUsers, updateUser, deleteUser } from '$lib/server/auth.js';

export const load = async () => {
	const users = await getAllUsers();
	return { users };
};

export const actions = {
	update: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const role = String(data.get('role') ?? '').trim();

		if (!id) return fail(400, { message: 'Missing user id.' });
		if (!email) return fail(400, { message: 'Email is required.' });
		if (!['user', 'admin'].includes(role)) return fail(400, { message: 'Invalid role.' });

		const updated = await updateUser(id, { email, role });
		if (!updated) return fail(404, { message: 'User not found.' });

		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '').trim();

		if (!id) return fail(400, { message: 'Missing user id.' });

		await deleteUser(id);
		return { success: true };
	}
};
