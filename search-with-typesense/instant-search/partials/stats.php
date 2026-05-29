<?php

/**
 * stats.php - Typesense instant search stats partial
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */
?>
<div class="cmswt-Stats"
     data-singular="<?php esc_attr_e( 'result found', 'search-with-typesense' ); ?>"
     data-plural="<?php esc_attr_e( 'results found', 'search-with-typesense' ); ?>"
     data-no_results="<?php esc_attr_e( 'no results found', 'search-with-typesense' ); ?>"
></div>