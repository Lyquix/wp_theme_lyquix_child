<?php

/**
 * pagination.php - Typesense instant search pagination partial
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */

use Codemanas\Typesense\Main\TypesenseAPI;

$post_type = $args['post_type'] ?? '';
?>
<div class="cmswt-Pagination cmswt-Pagination-<?php echo esc_html( TypesenseAPI::getInstance()->getCollectionNameFromSchema( $post_type ) ); ?>"></div>