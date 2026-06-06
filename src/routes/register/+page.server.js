import { fail, redirect } from '@sveltejs/kit';
import { createUser, getSessionCookieOptions, SESSION_COOKIE } from '$lib/server/auth.js';
import { getMongoDebugInfo } from '$lib/server/db.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const firstName = String(formData.get('firstName') ?? '').trim();
		const lastName  = String(formData.get('lastName')  ?? '').trim();
		const username  = String(formData.get('username')  ?? '').trim().toLowerCase();
		const email     = String(formData.get('email')     ?? '').trim();
		const password  = String(formData.get('password')  ?? '').trim();

		const fields = { firstName, lastName, username, email };

		if (!firstName) {
			return fail(400, { ...fields, message: 'First name is required.' });
		}

		if (!username) {
			return fail(400, { ...fields, message: 'Username is required.' });
		}
		if (!USERNAME_RE.test(username)) {
			return fail(400, {
				...fields,
				message: 'Username must be 3–20 characters and contain only letters, digits, or underscores.'
			});
		}

		if (!email) {
			return fail(400, { ...fields, message: 'Email is required.' });
		}

		if (!password) {
			return fail(400, { ...fields, message: 'Password is required.' });
		}
		if (password.length < 6) {
			return fail(400, { ...fields, message: 'Password must be at least 6 characters.' });
		}

		try {
			const user = await createUser({ email, password, username, firstName, lastName });
			cookies.set(SESSION_COOKIE, user.id, getSessionCookieOptions());
		} catch (error) {
			if (error?.code === 11000) {
				const key = error?.keyPattern;
				const field = key?.username ? 'username' : 'email';
				return fail(400, {
					...fields,
					message: `An account with this ${field} already exists.`
				});
			}

			console.error('Registration failed', {
				errorName: error?.name,
				errorCode: error?.code,
				errorMessage: error?.message,
				mongoConfig: getMongoDebugInfo()
			});
			return fail(500, {
				...fields,
				message: 'Registration failed. Check the MongoDB connection and try again.'
			});
		}

		throw redirect(303, '/rankings');
	}
};
