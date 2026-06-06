import { fail, redirect } from '@sveltejs/kit';
import {
	getLoginDebugInfo,
	getSessionCookieOptions,
	SESSION_COOKIE,
	verifyUser
} from '$lib/server/auth.js';
import { getMongoDebugInfo } from '$lib/server/db.js';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const identifier = String(formData.get('identifier') ?? '').trim();
		const password   = String(formData.get('password')   ?? '').trim();

		if (!identifier || !password) {
			return fail(400, {
				identifier,
				message: 'Email (or username) and password are required.'
			});
		}

		try {
			const user = await verifyUser({ identifier, password });

			if (!user) {
				console.info('Login rejected', {
					login: await getLoginDebugInfo(identifier),
					mongoConfig: getMongoDebugInfo()
				});

				return fail(400, {
					identifier,
					message: 'Invalid email, username, or password.'
				});
			}

			cookies.set(SESSION_COOKIE, user.id, getSessionCookieOptions());
		} catch (error) {
			console.error('Login failed', {
				errorName: error?.name,
				errorCode: error?.code,
				errorMessage: error?.message,
				mongoConfig: getMongoDebugInfo()
			});
			return fail(500, {
				identifier,
				message: 'Login failed. Check the MongoDB connection and try again.'
			});
		}

		throw redirect(303, '/');
	}
};
