<?php

/**
 * main-panel.php - Typesense instant search main panel template
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */

use Codemanas\Typesense\Main\TypesenseAPI;

$passed_args = $args['passed_args'] ?? [];
$config      = $args['config'] ?? [];
$facet       = $args['facet'] ?? [];
$schema      = $args['schema'] ?? [];
?>
<div class="cmswt-MainPanel">
    <div class="cmswt-Results">
		<?php
		foreach ( $passed_args['post_types'] as $post_type ) {
			/*
			 * Developers need to be aware of the $arguments sent to templates
			 */
			?>
            <div class="cmswt-Result cmswt-Result-<?php echo esc_attr( TypesenseAPI::getInstance()->getCollectionNameFromSchema( $post_type ) ); ?>">
				<?php
				/**
				 * Codemanas\Typesense\Main\TemplateHooks main_panel_result_body - 5
				 * Codemanas\Typesense\Main\TemplateHooks pagination - 10
				 */
				do_action( 'cm_typesense_instant_search_results_main_panel_body', $config, $post_type );
				?>
            </div>
		<?php }
		?>
    </div>
</div>