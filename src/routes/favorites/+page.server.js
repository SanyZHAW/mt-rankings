import { redirect } from '@sveltejs/kit';
import { getFavoriteFightersByUser } from '$lib/server/favorites.js';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		fighters: await getFavoriteFightersByUser(locals.user.id),
		user: locals.user
	};
};
