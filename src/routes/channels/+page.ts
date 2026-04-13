import { asset } from '$app/paths';
import type { PageLoad } from './$types';
import type { PlaylistBundle } from '$lib/types/feeds';

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

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch(asset('/data/channels.json'));
		if (!response.ok) {
			return { playlistBundle: emptyBundle };
		}
		const playlistBundle = (await response.json()) as PlaylistBundle;
		return { playlistBundle };
	} catch {
		return { playlistBundle: emptyBundle };
	}
};
