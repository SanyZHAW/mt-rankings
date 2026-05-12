import { getUserById, SESSION_COOKIE } from '$lib/server/auth.js';

export const handle = async ({ event, resolve }) => {
	const userId = event.cookies.get(SESSION_COOKIE);
	event.locals.user = null;

	if (userId) {
		try {
			event.locals.user = await getUserById(userId);
		} catch (error) {
			console.error('Could not load user session', error);
		}
	}

	return resolve(event);
};
