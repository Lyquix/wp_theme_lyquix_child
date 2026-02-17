<?php

use Codemanas\Typesense\Backend\Admin;

$args                   = $args ?? [];
$search_config_settings = Admin::get_search_config_settings();
$collections            = [];
foreach ( $search_config_settings['enabled_post_types'] as $enabled_post_type ) {
    if($enabled_post_type == 'all_posts') continue;
	$collections[ $enabled_post_type ] = \Codemanas\Typesense\Main\TypesenseAPI::getInstance()->getCollectionNameFromSchema( $enabled_post_type );
}

?>
<div class="cm-autocomplete"
     data-id="<?php echo esc_html( $args['unique_id'] ); ?>"
     data-site_url="<?php echo esc_html( apply_filters( 'cm_typesense_autocomplete_search_url', trailingslashit( home_url() ) . '?s=' ) ) ?>"
     data-collections="<?php echo _wp_specialchars( json_encode( apply_filters( 'cm_typesense_autocomplete_collections', $collections ) ), ENT_QUOTES, 'UTF-8', true ); ?>"
     data-placeholder="<?php esc_html_e( $args['placeholder'] ?? '' ); ?>"
     data-settings="<?php echo _wp_specialchars( json_encode( apply_filters( 'cm_typesense_search_autocomplete_settings', [] ) ), ENT_QUOTES, 'UTF-8', true ); ?>"
     data-query_by="post_title,post_content,post_excerpt"
     data-additional_autocomplete_params="<?php echo _wp_specialchars( json_encode( apply_filters( 'cm_typesense_additional_autocomplete_params', [] ) ), ENT_QUOTES, 'UTF-8', true ); ?>"
>
</div>
<script type="text/html" id="tmpl-cm-autocomplete-no-results">
    <section class="aa-empty">
        <div class="autocomplete-empty">
            <span>
            Sorry, we couldn't find any results for
            “<span class="query-text empty-query"></span>.”
        </span>
            <span>
            Please try using another keyword or phrase.
        </span>
        </div>
    </section>
</script>