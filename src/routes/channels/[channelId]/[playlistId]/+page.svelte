<script lang="ts">
	import type { PageData } from './$types';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { resolve } from '$app/paths';

	dayjs.extend(relativeTime);

	let { data }: { data: PageData } = $props();
</script>

<main class="cc-page">
	<div class="cc-bg-glow" aria-hidden="true"></div>
	<header class="cc-header">
		<div class="cc-breadcrumbs">
			<a href={resolve('/')} class="cc-breadcrumb">Frontpage</a>
			<span class="cc-breadcrumb-sep">/</span>
			<a href={resolve('/channels')} class="cc-breadcrumb">Channels</a>
			<span class="cc-breadcrumb-sep">/</span>
			<a href={resolve(`/channels/${data.channel.id}`)} class="cc-breadcrumb">{data.channel.title}</a>
			<span class="cc-breadcrumb-sep">/</span>
			<span class="cc-breadcrumb-current">{data.playlist.title}</span>
		</div>
		<h1 class="cc-title">{data.playlist.title}</h1>
		<p class="cc-subtitle">{data.playlist.items.length} video{data.playlist.items.length !== 1 ? 's' : ''}</p>
	</header>

	{#if data.playlist.items.length === 0}
		<section class="cc-empty">
			<h2>No videos</h2>
			<p>This playlist has no videos yet.</p>
		</section>
	{:else}
		<section class="cc-videos-grid">
			{#each data.playlist.items as video (video.videoId)}
				<a href={video.link} target="_blank" rel="noopener noreferrer" class="cc-video-card">
					<div class="cc-video-thumb-wrap">
						<img alt={video.title} src={video.thumbnail} class="cc-video-thumb" />
						{#if video.viewCount}
							<span class="cc-video-views">{(video.viewCount / 1000).toFixed(0)}k views</span>
						{/if}
					</div>
					<div class="cc-video-info">
						<h3 class="cc-video-title">{video.title}</h3>
						<p class="cc-video-meta">{video.channelTitle}</p>
						<p class="cc-video-date">{dayjs(video.publishedAt).fromNow()}</p>
					</div>
				</a>
			{/each}
		</section>
	{/if}
</main>

<style>
	.cc-breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.cc-breadcrumb {
		font-size: 0.85rem;
		color: var(--cc-text-secondary);
		text-decoration: none;
		transition: color 140ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.cc-breadcrumb:hover {
		color: var(--cc-accent);
	}

	.cc-breadcrumb-sep {
		font-size: 0.75rem;
		color: var(--cc-text-muted);
	}

	.cc-breadcrumb-current {
		font-size: 0.85rem;
		color: var(--cc-text-primary);
		font-weight: 550;
	}

	.cc-videos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.cc-video-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		border-radius: 0.75rem;
		overflow: hidden;
		background: var(--cc-bg-elev-1);
		border: 1px solid var(--cc-border-subtle);
		transition: all 160ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.cc-video-card:hover,
	.cc-video-card:focus-within {
		transform: translateY(-4px);
		box-shadow: var(--cc-shadow-card);
		border-color: var(--cc-accent);
	}

	.cc-video-thumb-wrap {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--cc-bg-elev-2);
	}

	.cc-video-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.cc-video-views {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.7);
		color: var(--cc-text-primary);
		backdrop-filter: blur(4px);
	}

	.cc-video-info {
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.cc-video-title {
		font-size: 0.9rem;
		font-weight: 650;
		margin: 0;
		line-height: 1.3;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.cc-video-meta {
		font-size: 0.75rem;
		color: var(--cc-text-secondary);
		margin: 0;
		line-height: 1.2;
	}

	.cc-video-date {
		font-size: 0.7rem;
		color: var(--cc-text-muted);
		margin: 0;
	}
</style>
