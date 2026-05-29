<?php

/**
 * header.php - Typesense autocomplete results header template
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */
?>
<script type="text/html" id="tmpl-cm-autocomplete-header">
    <div class="autocomplete-header all-posts-header">
        <div class="autocomplete-header-inner">
            <div class="autocomplete-header-title">
                HERE ARE THE RECOMMENDED RESULTS FOR "<span class="query-text">{{{document.querySelector('input#autocomplete-0-input').value}}}</span>".
            </div>
            <span class="autocomplete-description">
                Please click the "View All Results" button to view all the search results for "<span class="query-text">{{{document.querySelector('input#autocomplete-0-input').value}}}</span>"
            </span>
        </div>
    </div>

    <span class="autocomplete-header-title-label">{{{data.name}}}</span>
</script>
