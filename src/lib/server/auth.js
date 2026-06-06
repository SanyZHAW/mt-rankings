import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from './db.js';

export const SESSION_COOKIE = 'mt_rankings_user';

const hashPassword = (password) => {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password.trim(), salt, 64).toString('hex');
	return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
	if (!storedPassword) {
		return false;
	}

	const [salt, storedHash] = storedPassword.split(':');

	if (!salt || !storedHash) {
		return false;
	}

	const hash = scryptSync(password.trim(), salt, 64);
	const storedHashBuffer = Buffer.from(storedHash, 'hex');

	return storedHashBuffer.length === hash.length && timingSafeEqual(storedHashBuffer, hash);
};

const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeUsername = (username) => username.trim().toLowerCase();

const toPublicUser = (user) => ({
	id: user._id.toString(),
	email: user.email,
	username: user.username ?? '',
	firstName: user.firstName ?? '',
	lastName: user.lastName ?? '',
	role: user.role ?? 'user'
});

export const getSessionCookieOptions = () => ({
	httpOnly: true,
	path: '/',
	sameSite: 'lax',
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 24 * 7
});

export const createUser = async ({ email, password, username, firstName, lastName }) => {
	const users = await getUsersCollection();
	const normalizedEmail = normalizeEmail(email);
	const normalizedUsername = normalizeUsername(username);

	await users.createIndex({ email: 1 }, { unique: true });
	await users.createIndex({ username: 1 }, { unique: true });

	const result = await users.insertOne({
		email: normalizedEmail,
		username: normalizedUsername,
		firstName: firstName?.trim() ?? '',
		lastName: lastName?.trim() ?? '',
		passwordHash: hashPassword(password),
		createdAt: new Date()
	});

	return {
		id: result.insertedId.toString(),
		email: normalizedEmail,
		username: normalizedUsername
	};
};

export const verifyUser = async ({ identifier, password }) => {
	const users = await getUsersCollection();
	const normalized = identifier.trim().toLowerCase();
	const user = await users.findOne({
		$or: [{ email: normalized }, { username: normalized }]
	});

	if (!user || !verifyPassword(password, user.passwordHash)) {
		return null;
	}

	return toPublicUser(user);
};

export const getLoginDebugInfo = async (identifier) => {
	const users = await getUsersCollection();
	const normalized = identifier.trim().toLowerCase();
	const user = await users.findOne({
		$or: [{ email: normalized }, { username: normalized }]
	});
	const passwordHash = user?.passwordHash;

	return {
		userExists: Boolean(user),
		hasPasswordHash: Boolean(passwordHash),
		passwordHashFormatLooksValid: typeof passwordHash === 'string' && passwordHash.split(':').length === 2
	};
};

export const getUserById = async (userId) => {
	if (!ObjectId.isValid(userId)) {
		return null;
	}

	const users = await getUsersCollection();
	const user = await users.findOne({ _id: new ObjectId(userId) });

	return user ? toPublicUser(user) : null;
};

export const getAllUsers = async () => {
	const users = await getUsersCollection();
	const all = await users.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: 1 }).toArray();
	return all.map((u) => ({
		id: u._id.toString(),
		email: u.email,
		username: u.username ?? '',
		firstName: u.firstName ?? '',
		lastName: u.lastName ?? '',
		role: u.role ?? 'user',
		createdAt: u.createdAt ?? null
	}));
};

export const updateUser = async (userId, { email, role }) => {
	if (!ObjectId.isValid(userId)) return null;
	const users = await getUsersCollection();
	const $set = {};
	if (email !== undefined) $set.email = normalizeEmail(email);
	if (role !== undefined) $set.role = role;
	if (Object.keys($set).length === 0) return null;
	await users.updateOne({ _id: new ObjectId(userId) }, { $set });
	const updated = await users.findOne({ _id: new ObjectId(userId) });
	return updated ? toPublicUser(updated) : null;
};

export const deleteUser = async (userId) => {
	if (!ObjectId.isValid(userId)) return false;
	const users = await getUsersCollection();
	const result = await users.deleteOne({ _id: new ObjectId(userId) });
	return result.deletedCount === 1;
};
