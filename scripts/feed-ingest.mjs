import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const configPath = resolve(rootDir, 'config.json');
const outputPath = resolve(rootDir, 'static/data/feeds.json');

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

function assertConfig(config) {
	if (!config || typeof config !== 'object') {
		throw new Error('config.json must be a JSON object');
	}

	if (!Array.isArray(config.categories) || config.categories.length === 0) {
		throw new Error('config.json must include at least one category');
	}

	const idSet = new Set();
	for (const category of config.categories) {
		if (!category.id || !category.label || !Array.isArray(category.feeds)) {
			throw new Error(`Invalid category entry: ${JSON.stringify(category)}`);
		}
		if (idSet.has(category.id)) {
			throw new Error(`Duplicate category id: ${category.id}`);
		}
		idSet.add(category.id);
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

function resolveFeedTitle(feed, parsedFeed, channelItems) {
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
	assertConfig(config);

	const defaults = config.defaults ?? {};
	const failedSources = [];
	const categories = [];
	let sourceCount = 0;

	for (const category of config.categories) {
		const channels = [];
		const categoryItems = [];
		const categoryCap = category.maxItemsPerCategory ?? defaults.maxItemsPerCategory ?? 36;

		for (const feed of category.feeds) {
			if (!feed.enabled) continue;
			sourceCount += 1;
			try {
				const xml = await fetchWithRetry(
					feed.url,
					defaults.requestTimeoutMs ?? 12000,
					defaults.retryCount ?? 1
				);
				const parsed = parser.parse(xml);
				const entries = toArray(parsed?.feed?.entry);
				const limit = feed.maxItemsPerFeed ?? defaults.maxItemsPerFeed ?? 16;
				const channelItems = dedupeAndSort(
					entries.map((entry) => parseEntry(entry, feed.url)),
					limit
				);

				channels.push({
					id: playlistIdFromUrl(feed.url),
					title: resolveFeedTitle(feed, parsed?.feed, channelItems),
					feedUrl: feed.url,
					items: channelItems
				});
				categoryItems.push(...channelItems);
			} catch {
				failedSources.push(feed.url);
			}
		}

		categories.push({
			id: category.id,
			label: category.label,
			order: category.order,
			channels,
			items: dedupeAndSort(categoryItems, categoryCap)
		});
	}

	categories.sort((a, b) => a.order - b.order);

	const generatedAt = new Date().toISOString();
	const staleAfterHours = defaults.staleAfterHours ?? 36;
	const staleAgeHours = 0;
	const output = {
		metadata: {
			generatedAt,
			sourceCount,
			failedSources,
			staleAfterHours,
			staleAgeHours,
			stale: staleAgeHours > staleAfterHours
		},
		categories
	};

	await writeFile(outputPath, `${JSON.stringify(output, null, '\t')}\n`);
	console.log(`Generated ${outputPath}`);
	console.log(`Sources: ${sourceCount}, failed: ${failedSources.length}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
