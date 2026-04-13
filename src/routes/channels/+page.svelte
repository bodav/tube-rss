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
			<span class="cc-breadcrumb-current">Channels</span>
		</div>
		<h1 class="cc-title">CHANNELS</h1>
		<p class="cc-subtitle">Updated {dayjs(data.playlistBundle.metadata.generatedAt).fromNow()}</p>
	</header>

	{#if data.playlistBundle.channels.length === 0}
		<section class="cc-empty">
			<h2>No channels yet</h2>
			<p>Run the ingest script to generate data at <code>static/data/channels.json</code>.</p>
		</section>
	{:else}
		<section class="cc-channels-grid">
			{#each data.playlistBundle.channels as channel (channel.id)}
				<a href={resolve(`/channels/${channel.id}`)} class="cc-channel-card">
					<div class="cc-channel-thumb-wrap">
						<img alt={channel.title} src={channel.thumbnail} class="cc-channel-thumb" />
					</div>
					<div class="cc-channel-info">
						<h2 class="cc-channel-title">{channel.title}</h2>
						<span class="cc-channel-count">{channel.playlists.length} playlist{channel.playlists.length !== 1 ? 's' : ''}</span>
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

	.cc-channels-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.cc-channel-card {
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

	.cc-channel-card:hover,
	.cc-channel-card:focus-within {
		transform: translateY(-4px);
		box-shadow: var(--cc-shadow-card);
		border-color: var(--cc-accent);
	}

	.cc-channel-thumb-wrap {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--cc-bg-elev-2);
	}

	.cc-channel-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.cc-channel-info {
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.cc-channel-title {
		font-size: 0.95rem;
		font-weight: 650;
		margin: 0;
		line-height: 1.3;
	}

	.cc-channel-count {
		font-size: 0.75rem;
		color: var(--cc-text-muted);
	}
</style>
