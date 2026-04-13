import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const configPath = resolve(rootDir, 'config.json');
const outputPath = resolve(rootDir, 'static/data/channels.json');

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_'
});

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

function parseCount(value) {
	if (value === undefined || value === null || value === '') return null;
	const count = Number(value);
	return Number.isFinite(count) && count >= 0 ? count : null;
}

function assertChannelsConfig(config) {
	if (!config || typeof config !== 'object') {
		throw new Error('config.json must be a JSON object');
	}

	if (!Array.isArray(config.channels) || config.channels.length === 0) {
		throw new Error('config.json must include at least one channel for channel ingest');
	}

	const idSet = new Set();
	for (const channel of config.channels) {
		if (!channel.id || !channel.title || !channel.thumbnail) {
			throw new Error(`Invalid channel entry: ${JSON.stringify(channel)}`);
		}
		if (!Array.isArray(channel.playlists) || channel.playlists.length === 0) {
			throw new Error(`Channel ${channel.id} must have at least one playlist`);
		}
		if (idSet.has(channel.id)) {
			throw new Error(`Duplicate channel id: ${channel.id}`);
		}
		idSet.add(channel.id);

		for (const playlist of channel.playlists) {
			if (!playlist.url) {
				throw new Error(`Invalid playlist in channel ${channel.id}: ${JSON.stringify(playlist)}`);
			}
		}
	}
}

function playlistIdFromUrl(url) {
	try {
		const parsed = new URL(url);
		return (
			parsed.searchParams.get('playlist_id') ??
			parsed.searchParams.get('channel_id') ??
			parsed.hostname
		);
	} catch {
		return 'unknown-source';
	}
}

function parseEntry(entry, sourceUrl) {
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

async function fetchWithRetry(url, timeoutMs, retries) {
	let attempt = 0;
	let lastError = null;
	while (attempt <= retries) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetch(url, { signal: controller.signal });
			clearTimeout(timeout);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return await response.text();
		} catch (error) {
			clearTimeout(timeout);
			lastError = error;
			attempt += 1;
		}
	}

	throw lastError ?? new Error('Feed fetch failed');
}

function dedupeAndSort(items, limit) {
	const deduped = [];
	const seen = new Set();
	for (const item of items) {
		if (!item.videoId || seen.has(item.videoId)) continue;
		seen.add(item.videoId);
		deduped.push(item);
	}

	deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
	return deduped.slice(0, limit);
}

async function main() {
	const configRaw = await readFile(configPath, 'utf-8');
	const config = JSON.parse(configRaw);
	assertChannelsConfig(config);

	const defaults = config.defaults ?? {};
	const channelsOutput = [];
	let sourceCount = 0;
	const failedSources = [];

	for (const channelConfig of config.channels) {
		const playlists = [];

		for (const playlistConfig of channelConfig.playlists) {
			sourceCount += 1;
			try {
				const xml = await fetchWithRetry(
					playlistConfig.url,
					defaults.requestTimeoutMs ?? 12000,
					defaults.retryCount ?? 1
				);
				const parsed = parser.parse(xml);
				const entries = toArray(parsed?.feed?.entry);
				const limit = playlistConfig.maxItemsPerFeed ?? defaults.maxItemsPerFeed ?? 24;
				const playlistItems = dedupeAndSort(
					entries.map((entry) => parseEntry(entry, playlistConfig.url)),
					limit
				);

				const playlistId = playlistIdFromUrl(playlistConfig.url);
				const feedTitle = typeof parsed?.feed?.title === 'string' ? parsed.feed.title.trim() : '';
				const playlistTitle = (playlistConfig.label ?? feedTitle) || `Playlist ${playlistId}`;

				playlists.push({
					id: playlistId,
					url: playlistConfig.url,
					title: playlistTitle,
					thumbnail: playlistItems[0]?.thumbnail ?? channelConfig.thumbnail,
					items: playlistItems
				});
			} catch {
				failedSources.push(playlistConfig.url);
			}
		}

		if (playlists.length > 0) {
			channelsOutput.push({
				id: channelConfig.id,
				title: channelConfig.title,
				thumbnail: channelConfig.thumbnail,
				order: channelConfig.order,
				playlists
			});
		}
	}

	channelsOutput.sort((a, b) => a.order - b.order);

	const staleAfterHours = defaults.staleAfterHours ?? 36;
	const staleAgeHours = 0;
	const output = {
		metadata: {
			generatedAt: new Date().toISOString(),
			sourceCount,
			failedSources,
			staleAfterHours,
			staleAgeHours,
			stale: staleAgeHours > staleAfterHours
		},
		channels: channelsOutput
	};

	await writeFile(outputPath, `${JSON.stringify(output, null, '\t')}\n`);
	console.log(`Generated ${outputPath}`);
	console.log(`Channels: ${channelsOutput.length}, Playlists: ${sourceCount}, failed: ${failedSources.length}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
