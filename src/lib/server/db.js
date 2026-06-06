import { DB_URI, DB_NAME } from '$env/static/private';
import { MongoClient } from 'mongodb';

let client;
let clientPromise;

export const getMongoDebugInfo = () => ({
	dbUriExists: Boolean(DB_URI && DB_URI !== 'your-real-mongodb-uri-here'),
	dbName: DB_NAME || 'mt-rankings'
});

const getClient = () => {
	if (!DB_URI || DB_URI === 'your-real-mongodb-uri-here') {
		throw new Error('Missing MongoDB connection string. Set DB_URI in your local .env file.');
	}

	if (!clientPromise) {
		client = new MongoClient(DB_URI);
		clientPromise = client.connect();
	}

	return clientPromise;
};

export const getDb = async () => {
	const connectedClient = await getClient();
	return connectedClient.db(DB_NAME || 'mt-rankings');
};

export const getUsersCollection = async () => {
	const db = await getDb();
	return db.collection('users');
};

export const getFavoritesCollection = async () => {
	const db = await getDb();
	return db.collection('favorites');
};

export const getFightersCollection = async () => {
	const db = await getDb();
	return db.collection('fighters');
};

export const getRankingsCollection = async () => {
	const db = await getDb();
	return db.collection('rankings');
};

export const testDbConnection = async () => {
	const db = await getDb();
	await db.command({ ping: 1 });
	return {
		ok: true,
		database: db.databaseName,
		collections: {
			users: 'users',
			favorites: 'favorites'
		}
	};
};

export const closeDbConnection = async () => {
	if (client) {
		await client.close();
		client = undefined;
		clientPromise = undefined;
	}
};
