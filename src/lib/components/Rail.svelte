<script lang="ts">
	import type { FeedItem } from '$lib/types/feeds';
	import RailCard from './RailCard.svelte';

	type HeadingTag = 'h2' | 'h3';

	let {
		title,
		items,
		emptyMessage,
		ariaLabel,
		headCount,
		headingTag = 'h3',
		headingId
	}: {
		title?: string;
		items: FeedItem[];
		emptyMessage: string;
		ariaLabel: string;
		headCount?: string;
		headingTag?: HeadingTag;
		headingId?: string;
	} = $props();

	function handleRailKeydown(e: KeyboardEvent) {
		const rail = e.currentTarget as HTMLElement;
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			rail.scrollBy({ left: 340, behavior: 'smooth' });
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			rail.scrollBy({ left: -340, behavior: 'smooth' });
		}
	}

	function scrollRail(direction: 'left' | 'right', rail: HTMLElement) {
		rail.scrollBy({ left: direction === 'left' ? -520 : 520, behavior: 'smooth' });
	}

	function handleScroll(direction: 'left' | 'right', e: MouseEvent) {
		const rail = (e.currentTarget as HTMLElement).closest('.cc-rail-wrap')?.querySelector('.cc-rail');
		if (rail) scrollRail(direction, rail as HTMLElement);
	}
</script>

{#if title}
	<div class="cc-feed-rail-head">
		<svelte:element this={headingTag} id={headingId}>{title}</svelte:element>
		{#if headCount}
			<span>{headCount}</span>
		{/if}
	</div>
{/if}

<div class="cc-rail-wrap">
	<button class="cc-rail-btn cc-rail-btn-prev" aria-label={`Scroll ${ariaLabel} left`} onclick={(e) => handleScroll('left', e)}>&lt;</button>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="cc-rail" role="list" tabindex="0" aria-label={`${ariaLabel} videos`} onkeydown={handleRailKeydown}>
		{#if items.length === 0}
			<article class="cc-card cc-card-empty" role="listitem">
				<p>{emptyMessage}</p>
			</article>
		{:else}
			{#each items as item (item.videoId)}
				<RailCard {item} />
			{/each}
		{/if}
	</div>
	<button class="cc-rail-btn cc-rail-btn-next" aria-label={`Scroll ${ariaLabel} right`} onclick={(e) => handleScroll('right', e)}>&gt;</button>
</div>