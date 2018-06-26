#! /usr/bin/env bash

# Cleans the builds before each compile. If we don't do that, the generated artifacts may be incorrect
# and result in weird errors like "Invalid number of arguments to Solidity function"
#
# This seems to be especially true when importing code from 3rd party packages like openzeppelin
#
# Also copies the build directory to ../public/truffle, where truffle-contract can pick it up

# use the local truffle
TRUFFLE="node_modules/.bin/truffle"
# use the global truffle
#TRUFFLE="truffle"

echo "---- compiling contracts: ${TRUFFLE} compile $@"

if ${TRUFFLE} compile $@ ; then
    echo "---- post-compile actions (currently empty)"
    # if test "x$RAILS_APP_ROOT" = "x" ; then
    # 	echo "---- No RAILS_APP_ROOT defined, artifacts will not be copied"
    # elif test -d "$RAILS_APP_ROOT" ; then
    # 	echo "---- copy artifacts to public assets directory in $RAILS_APP_ROOT"
    # 	mkdir -p "RAILS_APP_ROOT/public/truffle"
    # 	rm -rf "RAILS_APP_ROOT/public/truffle/build"
    # 	cp -r build "RAILS_APP_ROOT/public/truffle"
    # else
    # 	echo "---- Rails app root does not exist: $RAILS_APP_ROOT"
    # fi
fi

