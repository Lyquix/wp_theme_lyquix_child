<?php

/**
 * item.php - Typesense autocomplete result item template
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */
?>
<script type="text/html" id="tmpl-cm-autocomplete">
    <div class="aa-ItemWrapper">
        <div class="aa-ItemContent">
            <# if ( data.document.post_thumbnail !== '' && data.document.post_thumbnail !== undefined ) { #>
            <div class="aa-ItemIcon aa-ItemIcon--alignTop">
                <img
                        src="{{{data.document.post_thumbnail}}}"
                        alt="{{data.document.post_title}}"
                        width="30"
                        height="30"
                />
            </div>
            <# } else { #> <# } #>
            <div class="aa-ItemContentBody">
                <div class="aa-ItemContentTitle">
                    {{{data.formatted.post_title}}}
                </div>
            </div>
        </div>
    </div>
</script>