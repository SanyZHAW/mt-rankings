import { fail, redirect } from '@sveltejs/kit';
import { updateProfile, changePassword } from '$lib/server/auth.js';

export const load = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	return { user: locals.user };
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export const actions = {
	updateProfile: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { action: 'profile', message: 'Not authenticated.' });

		const formData = await request.formData();
		const field = String(formData.get('field') ?? '');
		const value = String(formData.get('value') ?? '').trim();

		if (!['firstName', 'lastName', 'username', 'email'].includes(field)) {
			return fail(400, { action: 'profile', field, message: 'Invalid field.' });
		}

		if (field === 'firstName' && !value) {
			return fail(400, { action: 'profile', field, message: 'First name cannot be empty.' });
		}
		if (field === 'username' && !USERNAME_RE.test(value)) {
			return fail(400, {
				action: 'profile',
				field,
				message: 'Username must be 3–20 characters: letters, digits, or underscores.'
			});
		}
		if (field === 'email' && !value.includes('@')) {
			return fail(400, { action: 'profile', field, message: 'Invalid email address.' });
		}

		const result = await updateProfile(locals.user.id, { [field]: value });

		if (!result.ok) {
			return fail(400, { action: 'profile', field, message: result.message });
		}

		return { action: 'profile', field, success: true };
	},

	updatePassword: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { action: 'password', message: 'Not authenticated.' });

		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword     = String(formData.get('newPassword')     ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { action: 'password', message: 'All password fields are required.' });
		}
		if (newPassword.length < 6) {
			return fail(400, { action: 'password', message: 'New password must be at least 6 characters.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { action: 'password', message: 'New passwords do not match.' });
		}

		const result = await changePassword(locals.user.id, { currentPassword, newPassword });

		if (!result.ok) {
			return fail(400, { action: 'password', message: result.message });
		}

		return { action: 'password', success: true };
	}
};
