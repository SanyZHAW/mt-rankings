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
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '').trim();

		if (!email.trim() || !password) {
			return fail(400, {
				email,
				message: 'Email and password are required.'
			});
		}

		try {
			const user = await verifyUser({ email, password });

			if (!user) {
				console.info('Login rejected', {
					login: await getLoginDebugInfo(email),
					mongoConfig: getMongoDebugInfo()
				});

				return fail(400, {
					email,
					message: 'Invalid email or password.'
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
				email,
				message: 'Login failed. Check the MongoDB connection and try again.'
			});
		}

		throw redirect(303, '/rankings');
	}
};
