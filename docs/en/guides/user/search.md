# Search

Use this guide to find media by text, type, or date.

## MediaCMS Architecture

The search field sends your text to the search service of MediaCMS. The service searches the media that you may see. It does not search private media that you cannot open.

```mermaid
flowchart LR
    F[Search field] --> R[Results page]
    R --> API[Search API]
    API --> V[Media you can see]
    V --> L[Sorted and filtered list]
```

## Search for media

1. Select the search field at the top of the page.
2. Enter one or more words.
3. Press **Enter**, or select the search icon.
4. Select a result to open it.

While you type, the field can suggest matching titles. Select a suggestion to go to that media.

## Filter the results

1. On the results page, select **Filters**.
2. Under **MEDIA TYPE**, select **All**, **Video**, **Audio**, **Image**, or **Pdf**.
3. Under **UPLOAD DATE**, select **All**, **Today**, **This week**, **This month**, or **This year**.
4. Under **SORT BY**, select **Upload date (newest)**, **Upload date (oldest)**, **View count**, or **Like count**.

The list updates when you select an option.

## Search inside a category, tag, or author

- Select a category in **Categories** to see only media in that category.
- Select a tag in **Tags** to see only media with that tag.
- Select an author name on a media page to see the media of that author.

!!! note
    Search finds only media that you may see. If you cannot find a media item, the media can be private, not yet reviewed, or still encoding. See [Upload](upload.md).
