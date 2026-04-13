export interface FeedDefaults {
	maxItemsPerFeed: number;
	maxItemsPerCategory: number;
	staleAfterHours: number;
	requestTimeoutMs: number;
	retryCount: number;
}

export interface FeedSourceConfig {
	url: string;
	enabled: boolean;
	label?: string;
	maxItemsPerFeed?: number;
}

export interface CategoryConfig {
	id: string;
	label: string;
	order: number;
	maxItemsPerCategory?: number;
	feeds: FeedSourceConfig[];
}

export interface FeedConfig {
	defaults: FeedDefaults;
	categories: CategoryConfig[];
}

export interface FeedItem {
	videoId: string;
	title: string;
	publishedAt: string;
	thumbnail: string;
	channelTitle: string;
	viewCount: number | null;
	link: string;
	sourceUrl: string;
}

export interface FeedChannel {
	id: string;
	title: string;
	feedUrl: string;
	items: FeedItem[];
}

export interface FeedCategory {
	id: string;
	label: string;
	order: number;
	channels: FeedChannel[];
	items: FeedItem[];
}

export interface FeedMetadata {
	generatedAt: string;
	sourceCount: number;
	failedSources: string[];
	staleAfterHours: number;
	staleAgeHours: number;
	stale: boolean;
}

export interface GeneratedFeedBundle {
	metadata: FeedMetadata;
	categories: FeedCategory[];
}

// ============================================================================
// New 3-level Channels/Playlists/Videos Flow (separate from categories flow)
// ============================================================================

export interface PlaylistSourceConfig {
	url: string;
	label?: string;
}

export interface ChannelConfig {
	id: string;
	title: string;
	thumbnail: string;
	order: number;
	playlists: PlaylistSourceConfig[];
}

export interface ChannelsConfig {
	defaults?: FeedDefaults;
	channels: ChannelConfig[];
}

export interface Playlist {
	id: string;
	url: string;
	title: string;
	thumbnail?: string;
	description?: string;
	items: FeedItem[];
}

export interface Channel {
	id: string;
	title: string;
	thumbnail: string;
	order: number;
	playlists: Playlist[];
}

export interface PlaylistBundle {
	metadata: FeedMetadata;
	channels: Channel[];
}
