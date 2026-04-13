import { asset } from '$app/paths';
import type { PageLoad } from './$types';
import type { GeneratedFeedBundle } from '$lib/types/feeds';

const emptyBundle: GeneratedFeedBundle = {
	metadata: {
		generatedAt: new Date(0).toISOString(),
		sourceCount: 0,
		failedSources: [],
		staleAfterHours: 36,
		staleAgeHours: 0,
		stale: false
	},
	categories: []
};

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch(asset('/data/feeds.json'));
	if (!response.ok) {
		return { feedBundle: emptyBundle };
	}

	const feedBundle = (await response.json()) as GeneratedFeedBundle;
	return { feedBundle };
};
