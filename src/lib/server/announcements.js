import { getAnnouncementsCollection } from './db.js';

// Single-document singleton keyed by _id: 'current'.
// active: false effectively hides the banner without deleting the text.

export const getActiveAnnouncement = async () => {
	const col = await getAnnouncementsCollection();
	const doc = await col.findOne({ active: true });
	if (!doc) return null;
	return {
		text: doc.text,
		updatedAt: doc.updatedAt != null ? new Date(doc.updatedAt).toISOString() : null
	};
};

export const getCurrentAnnouncement = async () => {
	const col = await getAnnouncementsCollection();
	const doc = await col.findOne({ _id: 'current' });
	if (!doc) return null;
	return {
		text: doc.text ?? '',
		active: doc.active ?? false,
		updatedAt: doc.updatedAt != null ? new Date(doc.updatedAt).toISOString() : null,
		updatedBy: doc.updatedBy ?? ''
	};
};

export const upsertAnnouncement = async ({ text, updatedBy }) => {
	const col = await getAnnouncementsCollection();
	await col.updateOne(
		{ _id: 'current' },
		{
			$set: {
				text,
				active: true,
				updatedAt: new Date(),
				updatedBy
			}
		},
		{ upsert: true }
	);
	return { ok: true };
};
