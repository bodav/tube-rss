import type { PageLoad } from './$types';
import { asset } from '$app/paths';
import type { PlaylistBundle } from '$lib/types/feeds';
import { error } from '@sveltejs/kit';

const emptyBundle: PlaylistBundle = {
	metadata: {
		generatedAt: new Date(0).toISOString(),
		sourceCount: 0,
		failedSources: [],
		staleAfterHours: 36,
		staleAgeHours: 0,
		stale: false
	},
	channels: []
};

export const prerender = true;

export const load: PageLoad = async ({ params, fetch }) => {
	const { channelId } = params;

	let playlistBundle = emptyBundle;
	try {
		const response = await fetch(asset('/data/channels.json'));
		if (response.ok) {
			playlistBundle = (await response.json()) as PlaylistBundle;
		}
	} catch {
		// Use empty bundle
	}

	const channel = playlistBundle.channels.find((ch) => ch.id === channelId);
	if (!channel) {
		error(404, 'Channel not found');
	}

	return { channel, playlistBundle };
};
