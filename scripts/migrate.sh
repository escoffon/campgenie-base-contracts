#! /usr/bin/env bash

# Runs migration and copies the build directory to ../public/truffle, where truffle-contract can pick it up

# use the local truffle
TRUFFLE="node_modules/.bin/truffle"
# use the global truffle
#TRUFFLE="truffle"

SCRIPT_DIR=$(dirname $0)
ADJUST_CMD="node ${SCRIPT_DIR}/adjust_addresses.js"

echo "---- migrating contracts: ${TRUFFLE} migrate $@"
if ${TRUFFLE} migrate $@ ; then
    echo "---- adjusting contract addresses: ${ADJUST_CMD}"
    if ${ADJUST_CMD} ; then
	if test "x$RAILS_APP_ROOT" = "x" ; then
	    echo "---- No RAILS_APP_ROOT defined, artifacts will not be copied"
	    echo "---- Skipping the following commands:"
	    echo "mkdir -p \${RAILS_APP_ROOT}/public/truffle/build"
	    echo "rm -rf \${RAILS_APP_ROOT}/public/truffle/build/contracts"
	    echo "cp -r build/contracts \${RAILS_APP_ROOT}/public/truffle/build"
	elif test -d "$RAILS_APP_ROOT" ; then
	    echo "---- copy artifacts to public assets directory in $RAILS_APP_ROOT"
	    mkdir -p "${RAILS_APP_ROOT}/public/truffle/build"
	    rm -rf "${RAILS_APP_ROOT}/public/truffle/build/contracts"
	    cp -r build/contracts "${RAILS_APP_ROOT}/public/truffle/build"
	else
	    echo "---- Rails app root does not exist: $RAILS_APP_ROOT"
	    echo "---- Skipping the following commands:"
	    echo "mkdir -p \${RAILS_APP_ROOT}/public/truffle/build"
	    echo "rm -rf \${RAILS_APP_ROOT}/public/truffle/build/contracts"
	    echo "cp -r build/contracts \${RAILS_APP_ROOT}/public/truffle/build"
	fi
    fi
fi

