<?php

add_filter('acf/settings/load_json', function ($paths) {
    $path = get_template_directory().'/acf-json';
    $paths[] = $path;
    return $paths;
});
