<?php
/*
 * tmpl-cmswt-Result-itemTemplate--[post-type-slug]
 * for different templates for different post types add the post type slug instead of [post-type-slug] as the id
 * example tmpl-cm-typesense-shortcode-page-search-results or tmpl-cm-typesense-shortcode-book-search-results
 */
?>
<script type="text/html" id="tmpl-cmswt-Result-itemTemplate--default">
    <div class="hit-content flex gap-[2rem]">
        <a href="{{data.permalink}}" class="result-thumb">
            {{{data.post_thumbnail_html}}}
        </a>
        <div class="flex flex-col">
            <a href="{{data.permalink}}" class="no-underline">
                <h3 class="title">{{{data.formatted.post_title}}}</h3>
            </a>
            <div class="excerpt"><p>{{{data.post_content.substring(0, 220) + '…'}}}</p></div>
            <div class="hit-link underline hover:no-underline">
                <a href="{{data.permalink}}" class="ais-hits--title-link"><?php _e( 'Visit Page', 'search-with-typesense' ); ?></a>
            </div>
        </div>
    </div>
</script>