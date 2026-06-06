import { error, redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	if (locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}
	return {};
};
