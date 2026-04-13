# static page feature

static content / playlists that are almost never changed and should only be updated by running a ingest script manually.

the page should feature a rails overview of a channels playlists and when an items is clicked the playlists within that channel should be shown in a card grid on a new page

## config example

```json
{
    "channels": [
        {
			"id": "timeteam",
            "title": "Time Team",
            "thumbnail": "https://yt3.googleusercontent.com/ytc/AIdro_mSYXNojBkwskrze2Cj1L7HZZFcdA7r9GlSiP3dLs08mw=s160-c-k-c0x00ffffff-no-rj",
			"order": 1,
			"playlists": [
				{
					"url": "https://www.youtube.com/feeds/videos.xml?playlist_id=PL3nVK6mXS9Qr-KMQwsiuDikmEOSwQM56c"
				},
                {
                    "url": "https://www.youtube.com/feeds/videos.xml?playlist_id=PL3nVK6mXS9Qqfo9rzufNneZuT28vLm4uC"
                },
                {
                    "url": "https://www.youtube.com/feeds/videos.xml?playlist_id=PL3nVK6mXS9Qrs8UH7yQ2Q58kI_oyQWa4Y"
                }
			]
        }
    ]
}
```