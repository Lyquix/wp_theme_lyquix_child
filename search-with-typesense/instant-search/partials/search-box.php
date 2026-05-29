<?php

/**
 * search-box.php - Typesense instant search search box partial
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */
?>
<div class="cmswt-SearchBox"
     data-settings="<?php echo _wp_specialchars( json_encode( apply_filters( 'cm_typesense_search_box_settings', [] ) ),
	     ENT_QUOTES,
	     'UTF-8',
	     true ); ?>"
></div>