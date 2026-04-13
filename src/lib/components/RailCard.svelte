<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import type { FeedItem } from '$lib/types/feeds';

	dayjs.extend(relativeTime);

	let { item }: { item: FeedItem } = $props();

	function formatViewCount(count: number | null | undefined): string {
		if (count === null || count === undefined || Number.isNaN(count)) return 'Views N/A';
		if (count < 1000) return `${count} views`;
		if (count < 1_000_000) return `${(count / 1000).toFixed(count >= 100_000 ? 0 : 1)}K views`;
		return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M views`;
	}
</script>

<article class="cc-card" role="listitem">
	<a class="cc-card-link" href={item.link} target="_blank" rel="noreferrer">
		<div class="cc-thumb-wrap">
			<img class="cc-thumb" src={item.thumbnail} alt={`${item.title} by ${item.channelTitle}`} />
			<span class="cc-chip">{item.channelTitle}</span>
			<span class="cc-views">{formatViewCount(item.viewCount)}</span>
		</div>
		<h3>{item.title}</h3>
		<p>{dayjs(item.publishedAt).fromNow()}</p>
	</a>
</article>