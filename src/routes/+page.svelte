<script lang="ts">
	import type { PageData } from './$types';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import Rail from '$lib/components/Rail.svelte';

	dayjs.extend(relativeTime);

	let { data }: { data: PageData } = $props();
	type ViewMode = 'category' | 'feed';
	let viewMode = $state<ViewMode>('category');
	let selectedCategoryId = $state('');

	// Reactive derived from props so it stays in sync after hydration
	const stale = $derived(data.feedBundle.metadata.stale);
	const filteredCategories = $derived(
		selectedCategoryId
			? data.feedBundle.categories.filter((category) => category.id === selectedCategoryId)
			: data.feedBundle.categories
	);

	function handleCategoryChange(value: string) {
		selectedCategoryId = value;
		if (value) {
			viewMode = 'feed';
		}
	}
</script>

<main class="cc-page">
	<div class="cc-bg-glow" aria-hidden="true"></div>
	<header class="cc-header">
		<h1 class="cc-title">TUBE RSS</h1>
		<p class="cc-subtitle">
			Updated {dayjs(data.feedBundle.metadata.generatedAt).fromNow()} from
			{data.feedBundle.metadata.sourceCount} feeds
		</p>
		<div class="cc-header-controls">
			<div class="cc-browse-wrap">
				<a class="cc-browse-btn" href="/channels">Browse</a>
			</div>
			<div class="cc-filter-wrap">
				<label class="cc-filter-label" for="category-filter">Filter by category</label>
				<select
					id="category-filter"
					class="cc-filter-select"
					value={selectedCategoryId}
					onchange={(e) => handleCategoryChange((e.currentTarget as HTMLSelectElement).value)}
				>
					<option value="">All categories</option>
					{#each data.feedBundle.categories as category (category.id)}
						<option value={category.id}>{category.label}</option>
					{/each}
				</select>
			</div>

			<div class="cc-view-toggle" role="group" aria-label="Video rail grouping">
				<button
					class="cc-toggle-btn"
					class:is-active={viewMode === 'category'}
					type="button"
					onclick={() => (viewMode = 'category')}
				>
					By category
				</button>
				<button
					class="cc-toggle-btn"
					class:is-active={viewMode === 'feed'}
					type="button"
					onclick={() => (viewMode = 'feed')}
				>
					By feed
				</button>
			</div>
		</div>
	</header>

	{#if stale}
		<div class="cc-banner" role="status" aria-live="polite">
			Feed data is stale ({data.feedBundle.metadata.staleAgeHours}h old). Showing the latest
			successful refresh.
		</div>
	{/if}

	{#if data.feedBundle.categories.length === 0}
		<section class="cc-empty">
			<h2>No categories yet</h2>
			<p>Run feed ingestion to generate data at <code>static/data/feeds.json</code>.</p>
		</section>
	{:else if filteredCategories.length === 0}
		<section class="cc-empty">
			<h2>No matching categories</h2>
			<p>Try a different filter value.</p>
		</section>
	{:else if viewMode === 'category'}
		{#each filteredCategories as category, i (category.id)}
			<section class="cc-section" aria-labelledby={`category-${category.id}`} style:--stagger-i={i}>
				<div class="cc-section-head">
					<h2 id={`category-${category.id}`}>{category.label}</h2>
					<span>{category.items.length} videos</span>
				</div>

				<Rail items={category.items} ariaLabel={category.label} emptyMessage="No videos in this category yet." />
			</section>
		{/each}
	{:else}
		{#each filteredCategories as category, i (category.id)}
			<section class="cc-section" aria-labelledby={`feed-category-${category.id}`} style:--stagger-i={i}>
				<div class="cc-section-head">
					<h2 id={`feed-category-${category.id}`}>{category.label}</h2>
					<span>{category.channels.length} feeds</span>
				</div>

				<div class="cc-feed-group">
					{#if category.channels.length === 0}
						<section class="cc-empty">
							<h3>No feeds yet</h3>
							<p>Enable feeds in <code>config.json</code> and re-run ingestion.</p>
						</section>
					{:else}
						{#each category.channels as channel (channel.id)}
							<div class="cc-feed-rail-block">
								<Rail
									title={channel.title}
									headCount={`${channel.items.length} videos`}
									headingTag="h3"
									items={channel.items}
									ariaLabel={channel.title}
									emptyMessage="No videos in this feed yet."
								/>
							</div>
						{/each}
					{/if}
				</div>
			</section>
		{/each}
	{/if}
</main>
