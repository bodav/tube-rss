<script lang="ts">
	import type { PageData } from './$types';
	import { base } from '$app/paths';

	let { data }: { data: PageData } = $props();
	const basePath = $derived(base.endsWith('/') ? base.slice(0, -1) : base);
	const withBase = (path: string) => `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
</script>

<main class="cc-page">
	<div class="cc-bg-glow" aria-hidden="true"></div>
	<header class="cc-header">
		<div class="cc-breadcrumbs">
			<a href={withBase('/')} class="cc-breadcrumb">Frontpage</a>
			<span class="cc-breadcrumb-sep">/</span>
			<a href={withBase('/channels')} class="cc-breadcrumb">Channels</a>
			<span class="cc-breadcrumb-sep">/</span>
			<span class="cc-breadcrumb-current">{data.channel.title}</span>
		</div>
		<h1 class="cc-title">{data.channel.title}</h1>
		<p class="cc-subtitle">{data.channel.playlists.length} playlist{data.channel.playlists.length !== 1 ? 's' : ''}</p>
	</header>

	{#if data.channel.playlists.length === 0}
		<section class="cc-empty">
			<h2>No playlists</h2>
			<p>This channel has no playlists configured.</p>
		</section>
	{:else}
		<section class="cc-playlists-grid">
			{#each data.channel.playlists as playlist (playlist.id)}
				<a href={withBase(`/channels/${data.channel.id}/${playlist.id}`)} class="cc-playlist-card">
					<div class="cc-playlist-thumb-wrap">
						{#if playlist.thumbnail}
							<img alt={playlist.title} src={playlist.thumbnail} class="cc-playlist-thumb" />
						{:else}
							<div class="cc-playlist-thumb-placeholder">No image</div>
						{/if}
						<span class="cc-playlist-item-count">{playlist.items.length} video{playlist.items.length !== 1 ? 's' : ''}</span>
					</div>
					<div class="cc-playlist-info">
						<h2 class="cc-playlist-title">{playlist.title}</h2>
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

	.cc-playlists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.cc-playlist-card {
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

	.cc-playlist-card:hover,
	.cc-playlist-card:focus-within {
		transform: translateY(-4px);
		box-shadow: var(--cc-shadow-card);
		border-color: var(--cc-accent);
	}

	.cc-playlist-thumb-wrap {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--cc-bg-elev-2);
	}

	.cc-playlist-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.cc-playlist-thumb-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--cc-text-muted);
		font-size: 0.75rem;
	}

	.cc-playlist-item-count {
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

	.cc-playlist-info {
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.cc-playlist-title {
		font-size: 0.95rem;
		font-weight: 650;
		margin: 0;
		line-height: 1.3;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
