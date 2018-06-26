#! /usr/bin/env bash
#
# Runs the Node script to merge contract addresses into the generated Truffle artifacts.

SCRIPT_DIR=$(dirname $0)
CMD="node ${SCRIPT_DIR}/adjust_addresses.js"

echo "---- adjusting contract addresses: ${CMD}"
${CMD}
