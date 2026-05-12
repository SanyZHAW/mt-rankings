import { fail, redirect } from '@sveltejs/kit';
import { getFavoriteFightersByUser, removeFavorite } from '$lib/server/favorites.js';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		fighters: await getFavoriteFightersByUser(locals.user.id),
		user: locals.user
	};
};

export const actions = {
	remove: async ({ locals, request }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const fighterId = String(formData.get('fighterId') ?? '');

		if (!fighterId) {
			return fail(400, {
				message: 'Missing fighter ID.'
			});
		}

		await removeFavorite({
			userId: locals.user.id,
			fighterId
		});

		return {
			message: 'Favorite removed.'
		};
	}
};
