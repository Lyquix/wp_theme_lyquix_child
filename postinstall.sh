#!/bin/bash

#  postinstall.sh - Post-installation script for Lyquix WordPress theme

#  @version     3.2.0
#  @package     wp_theme_lyquix_child
#  @author      Lyquix
#  @copyright   Copyright (C) 2015 - 2024 Lyquix
#  @license     GNU General Public License version 2 or later
#  @link        https://github.com/Lyquix/wp_theme_lyquix_child

#   .d8888b. 88888888888 .d88888b.  8888888b.   888
#  d88P  Y88b    888    d88P" "Y88b 888   Y88b  888
#  Y88b.         888    888     888 888    888  888
#   "Y888b.      888    888     888 888   d88P  888
#      "Y88b.    888    888     888 8888888P"   888
#        "888    888    888     888 888         Y8P
#  Y88b  d88P    888    Y88b. .d88P 888          "
#   "Y8888P"     888     "Y88888P"  888         888

# DO NOT MODIFY THIS FILE!

# Get the current directory and the directory of the script
CURRDIR="${PWD}"
SCRIPTDIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
cd ${SCRIPTDIR}

# Define parent theme directory
PARENTDIR="../lyquix"

# Ensure the required directories exist
mkdir -p css/custom
mkdir -p js/custom/scripts
mkdir -p php/custom/templates

# Check for files that need to be created
if [ ! -f .htaccess ]; then
	cp "${PARENTDIR}/.htaccess" .htaccess
fi
if [ ! -f custom.php ]; then
	cp "${PARENTDIR}/custom.dist.php" custom.php
fi
if [ ! -f css/custom/custom.scss ]; then
	cp "${PARENTDIR}/css/custom/custom.dist.scss" css/custom/custom.scss
fi
if [ ! -f css/custom.css ]; then
	echo "/* This file will be overwritten when SCSS is compiled */" > css/custom.css
fi
if [ ! -f css/custom/editor.css ]; then
	echo "/* This file will be overwritten when SCSS is compiled */" > css/custom/editor.css
fi
if [ ! -f css/tailwind/presets.js ]; then
	cp "${PARENTDIR}/css/tailwind/presets.dist.js" css/tailwind/presets.js
fi
if [ ! -f css/tailwind/theme.js ]; then
	cp "${PARENTDIR}/css/tailwind/theme.dist.js" css/tailwind/theme.js
fi
if [ ! -f js/scripts.ts ]; then
	cp "${PARENTDIR}/js/scripts.dist.ts" js/scripts.ts
fi
if [ ! -f js/custom/scripts/module.ts ]; then
	cp "${PARENTDIR}/js/custom/scripts/module.dist.ts" js/custom/scripts/module.ts
fi
if [ ! -f php/custom/templates/404.php ]; then
	cp "${PARENTDIR}/php/custom/templates/404.dist.php" php/custom/templates/404.php
fi
if [ ! -f php/custom/templates/search.php ]; then
	cp "${PARENTDIR}/php/custom/templates/search.dist.php" php/custom/templates/search.php
fi

for DIRPATH in "${PARENTDIR}/css/lib"/*/; do
  DIR="$(basename "$DIRPATH")"

  # Create matching directory under css/custom if missing
  mkdir -p "css/custom/$DIR"

  # Scan all .dist.scss files in the parent directory
  for SRCFILE in "$DIRPATH"*.dist.scss; do
    # Strip .dist from the filename
    FILENAME="$(basename "$SRCFILE" .dist.scss).scss"
    TARGET="css/custom/$DIR/$FILENAME"

    # Copy only if it doesn't already exist
    if [ ! -f "$TARGET" ]; then
      cp "$SRCFILE" "$TARGET"
    fi
  done
done

cd ${CURRDIR}

