import { fail, redirect } from '@sveltejs/kit';
import { createUser, getSessionCookieOptions, SESSION_COOKIE } from '$lib/server/auth.js';
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

		if (password.length < 6) {
			return fail(400, {
				email,
				message: 'Password must be at least 6 characters.'
			});
		}

		try {
			const user = await createUser({ email, password });
			cookies.set(SESSION_COOKIE, user.id, getSessionCookieOptions());
		} catch (error) {
			if (error?.code === 11000) {
				return fail(400, {
					email,
					message: 'An account with this email already exists.'
				});
			}

			console.error('Registration failed', {
				errorName: error?.name,
				errorCode: error?.code,
				errorMessage: error?.message,
				mongoConfig: getMongoDebugInfo()
			});
			return fail(500, {
				email,
				message: 'Registration failed. Check the MongoDB connection and try again.'
			});
		}

		throw redirect(303, '/rankings');
	}
};
