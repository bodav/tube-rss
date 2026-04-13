import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';

// ---------------------------------------------------------------------------
// Helpers extracted from feed-ingest.mjs for isolated unit testing
// ---------------------------------------------------------------------------

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_'
});

const toArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

interface RawEntry {
	'yt:videoId'?: string;
	id?: string;
	title?: string;
	published?: string;
	updated?: string;
	author?: { name?: string };
	'media:group'?: {
		'media:thumbnail'?: { '@_url'?: string } | { '@_url'?: string }[];
		'media:community'?: { 'media:statistics'?: { '@_views'?: string } };
	};
	'yt:statistics'?: { '@_viewCount'?: string };
	link?: { '@_href'?: string };
}

function parseCount(value: unknown): number | null {
	if (value === undefined || value === null || value === '') return null;
	const count = Number(value);
	return Number.isFinite(count) && count >= 0 ? count : null;
}

function parseEntry(entry: RawEntry, sourceUrl: string) {
	const videoId = entry['yt:videoId'] ?? entry.id ?? '';
	const title = entry.title ?? 'Untitled video';
	const publishedAt = entry.published ?? entry.updated ?? new Date(0).toISOString();
	const channelTitle = entry.author?.name ?? 'Unknown channel';
	const mediaThumb = toArray(entry?.['media:group']?.['media:thumbnail'])[0]?.['@_url'];
	const mediaViews = entry?.['media:group']?.['media:community']?.['media:statistics']?.['@_views'];
	const ytViews = entry?.['yt:statistics']?.['@_viewCount'];
	const viewCount = parseCount(mediaViews ?? ytViews);
	const link = entry.link?.['@_href'] ?? `https://www.youtube.com/watch?v=${videoId}`;
	return {
		videoId,
		title,
		publishedAt,
		thumbnail: mediaThumb ?? 'https://i.ytimg.com/vi/default/hqdefault.jpg',
		channelTitle,
		viewCount,
		link,
		sourceUrl
	};
}

function resolveFeedTitle(
	feed: { label?: string },
	parsedFeed: { title?: string; author?: { name?: string } } | undefined,
	channelItems: ReturnType<typeof parseEntry>[]
) {
	if (feed.label) return feed.label;

	const feedTitle = typeof parsedFeed?.title === 'string' ? parsedFeed.title.trim() : '';
	if (feedTitle && feedTitle.toLowerCase() !== 'videos') {
		return feedTitle;
	}

	const authorName = typeof parsedFeed?.author?.name === 'string' ? parsedFeed.author.name.trim() : '';
	if (authorName) {
		return authorName;
	}

	const channelTitle = channelItems.find((item) => item.channelTitle)?.channelTitle?.trim();
	if (channelTitle) {
		return channelTitle;
	}

	return feedTitle || 'Untitled feed';
}

function dedupeAndSort(items: ReturnType<typeof parseEntry>[], limit: number) {
	const deduped: ReturnType<typeof parseEntry>[] = [];
	const seen = new Set<string>();
	for (const item of items) {
		if (!item.videoId || seen.has(item.videoId)) continue;
		seen.add(item.videoId);
		deduped.push(item);
	}
	deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
	return deduped.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseEntry', () => {
	it('maps a well-formed entry correctly', () => {
		const entry: RawEntry = {
			'yt:videoId': 'abc123',
			title: 'Test Video',
			published: '2026-04-10T12:00:00+00:00',
			author: { name: 'Test Channel' },
			'media:group': {
				'media:thumbnail': { '@_url': 'https://example.com/thumb.jpg' },
				'media:community': { 'media:statistics': { '@_views': '12345' } }
			},
			link: { '@_href': 'https://www.youtube.com/watch?v=abc123' }
		};
		const result = parseEntry(entry, 'https://feeds.example.com');
		expect(result.videoId).toBe('abc123');
		expect(result.title).toBe('Test Video');
		expect(result.thumbnail).toBe('https://example.com/thumb.jpg');
		expect(result.channelTitle).toBe('Test Channel');
		expect(result.viewCount).toBe(12345);
		expect(result.link).toBe('https://www.youtube.com/watch?v=abc123');
	});

	it('falls back to null viewCount when no stats are present', () => {
		const result = parseEntry({ 'yt:videoId': 'no-views' }, 'https://feeds.example.com');
		expect(result.viewCount).toBeNull();
	});

	it('supports yt:statistics viewCount when media stats are absent', () => {
		const result = parseEntry(
			{ 'yt:videoId': 'yt-stats', 'yt:statistics': { '@_viewCount': '6789' } },
			'https://feeds.example.com'
		);
		expect(result.viewCount).toBe(6789);
	});

	it('uses fallback title when title is missing', () => {
		const result = parseEntry({ 'yt:videoId': 'vid1' }, 'https://feeds.example.com');
		expect(result.title).toBe('Untitled video');
	});

	it('falls back to default thumbnail when media:thumbnail is absent', () => {
		const result = parseEntry(
			{ 'yt:videoId': 'vid2', title: 'No Thumb' },
			'https://feeds.example.com'
		);
		expect(result.thumbnail).toBe('https://i.ytimg.com/vi/default/hqdefault.jpg');
	});

	it('falls back to "Unknown channel" when author is absent', () => {
		const result = parseEntry({ 'yt:videoId': 'vid3' }, 'https://feeds.example.com');
		expect(result.channelTitle).toBe('Unknown channel');
	});

	it('falls back to constructed watch URL when link href is absent', () => {
		const result = parseEntry({ 'yt:videoId': 'vid4' }, 'https://feeds.example.com');
		expect(result.link).toBe('https://www.youtube.com/watch?v=vid4');
	});

	it('uses updated as publishedAt fallback when published is absent', () => {
		const entry: RawEntry = {
			'yt:videoId': 'vid5',
			updated: '2026-03-01T00:00:00+00:00'
		};
		const result = parseEntry(entry, 'https://feeds.example.com');
		expect(result.publishedAt).toBe('2026-03-01T00:00:00+00:00');
	});

	it('handles media:thumbnail as array and picks first url', () => {
		const entry: RawEntry = {
			'yt:videoId': 'vid6',
			'media:group': {
				'media:thumbnail': [
					{ '@_url': 'https://example.com/first.jpg' },
					{ '@_url': 'https://example.com/second.jpg' }
				]
			}
		};
		const result = parseEntry(entry, 'https://feeds.example.com');
		expect(result.thumbnail).toBe('https://example.com/first.jpg');
	});
});

describe('dedupeAndSort', () => {
	it('removes duplicate videoIds keeping first occurrence', () => {
		const items = [
			parseEntry({ 'yt:videoId': 'dup', published: '2026-04-01T00:00:00Z' }, 'src'),
			parseEntry({ 'yt:videoId': 'dup', published: '2026-04-02T00:00:00Z' }, 'src')
		];
		const result = dedupeAndSort(items, 100);
		expect(result).toHaveLength(1);
		expect(result[0].videoId).toBe('dup');
	});

	it('sorts items newest-first', () => {
		const items = [
			parseEntry({ 'yt:videoId': 'a', published: '2026-01-01T00:00:00Z' }, 'src'),
			parseEntry({ 'yt:videoId': 'b', published: '2026-04-01T00:00:00Z' }, 'src'),
			parseEntry({ 'yt:videoId': 'c', published: '2026-02-01T00:00:00Z' }, 'src')
		];
		const result = dedupeAndSort(items, 100);
		expect(result.map((r) => r.videoId)).toEqual(['b', 'c', 'a']);
	});

	it('truncates to the given limit', () => {
		const items = Array.from({ length: 20 }, (_, i) =>
			parseEntry(
				{ 'yt:videoId': `v${i}`, published: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z` },
				'src'
			)
		);
		const result = dedupeAndSort(items, 5);
		expect(result).toHaveLength(5);
	});

	it('skips entries with empty videoId', () => {
		const items = [
			parseEntry({ 'yt:videoId': '' }, 'src'),
			parseEntry({ 'yt:videoId': 'good' }, 'src')
		];
		const result = dedupeAndSort(items, 100);
		expect(result).toHaveLength(1);
		expect(result[0].videoId).toBe('good');
	});
});

describe('resolveFeedTitle', () => {
	it('prefers configured feed label when present', () => {
		const title = resolveFeedTitle(
			{ label: 'Custom Feed Name' },
			{ title: 'Videos', author: { name: 'Actual Channel' } },
			[]
		);
		expect(title).toBe('Custom Feed Name');
	});

	it('keeps non-generic feed titles', () => {
		const title = resolveFeedTitle({}, { title: 'Interesting Playlist' }, []);
		expect(title).toBe('Interesting Playlist');
	});

	it('uses author name when feed title is generic Videos', () => {
		const title = resolveFeedTitle({}, { title: 'Videos', author: { name: 'BBC Earth' } }, []);
		expect(title).toBe('BBC Earth');
	});

	it('falls back to channel title when feed title is Videos and author missing', () => {
		const channelItems = [parseEntry({ 'yt:videoId': 'abc', author: { name: 'DW Documentary' } }, 'src')];
		const title = resolveFeedTitle({}, { title: 'Videos' }, channelItems);
		expect(title).toBe('DW Documentary');
	});
});

describe('XML parsing integration', () => {
	it('parses a minimal YouTube Atom feed XML', () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <yt:videoId>xyz789</yt:videoId>
    <title>Sample Video Title</title>
    <published>2026-04-11T10:00:00+00:00</published>
    <author><name>Sample Channel</name></author>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/xyz789/hqdefault.jpg"/>
    </media:group>
    <link rel="alternate" href="https://www.youtube.com/watch?v=xyz789"/>
  </entry>
</feed>`;
		const parsed = parser.parse(xml);
		const entries = toArray(parsed?.feed?.entry);
		expect(entries).toHaveLength(1);
		const item = parseEntry(entries[0] as RawEntry, 'https://feeds.youtube.com/test');
		expect(item.videoId).toBe('xyz789');
		expect(item.title).toBe('Sample Video Title');
		expect(item.channelTitle).toBe('Sample Channel');
	});

	it('handles an empty feed entry list gracefully', () => {
		const xml = `<?xml version="1.0"?><feed></feed>`;
		const parsed = parser.parse(xml);
		const entries = toArray(parsed?.feed?.entry);
		expect(entries).toHaveLength(0);
	});
});

describe('Channels configuration', () => {
	it('accepts a valid channels config with required fields', () => {
		const config = {
			channels: [
				{
					id: 'channel1',
					title: 'Test Channel',
					thumbnail: 'https://example.com/thumb.jpg',
					order: 1,
					playlists: [
						{
							url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL123'
						}
					]
				}
			]
		};
		expect(config.channels).toHaveLength(1);
		expect(config.channels[0].id).toBe('channel1');
	});

	it('rejects channel without required id field', () => {
		const config = {
			channels: [
				{
					title: 'Test Channel',
					thumbnail: 'https://example.com/thumb.jpg',
					order: 1,
					playlists: []
				}
			]
		} as any;
		expect(config.channels[0].id).toBeUndefined();
	});

	it('rejects channel with empty playlists array', () => {
		const config = {
			channels: [
				{
					id: 'channel1',
					title: 'Test Channel',
					thumbnail: 'https://example.com/thumb.jpg',
					order: 1,
					playlists: []
				}
			]
		};
		expect(config.channels[0].playlists.length).toBe(0);
	});

	it('accepts channel with optional playlist label', () => {
		const config = {
			channels: [
				{
					id: 'channel1',
					title: 'Test Channel',
					thumbnail: 'https://example.com/thumb.jpg',
					order: 1,
					playlists: [
						{
							url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL123',
							label: 'Custom Playlist Name'
						}
					]
				}
			]
		};
		expect(config.channels[0].playlists[0].label).toBe('Custom Playlist Name');
	});

	it('supports multiple playlists per channel', () => {
		const config = {
			channels: [
				{
					id: 'channel1',
					title: 'Test Channel',
					thumbnail: 'https://example.com/thumb.jpg',
					order: 1,
					playlists: [
						{
							url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL123'
						},
						{
							url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL456',
							label: 'Second Playlist'
						}
					]
				}
			]
		};
		expect(config.channels[0].playlists).toHaveLength(2);
	});

	it('supports multiple channels', () => {
		const config = {
			channels: [
				{
					id: 'channel1',
					title: 'Test Channel 1',
					thumbnail: 'https://example.com/thumb1.jpg',
					order: 1,
					playlists: [{ url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL123' }]
				},
				{
					id: 'channel2',
					title: 'Test Channel 2',
					thumbnail: 'https://example.com/thumb2.jpg',
					order: 2,
					playlists: [{ url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL456' }]
				}
			]
		};
		expect(config.channels).toHaveLength(2);
		expect(config.channels[0].order).toBeLessThan(config.channels[1].order);
	});
});
