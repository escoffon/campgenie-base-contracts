#! /usr/bin/env bash
# Cribbed from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/scripts/test.sh

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

# use the local truffle
TRUFFLE="node_modules/.bin/truffle"
# use the global truffle
#TRUFFLE="truffle"

# use the local ganache
GANACHE="node_modules/.bin/ganache-cli"
# use the global ganache
#GANACHE="ganache-cli"

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  ganache_port=8555
else
  ganache_port=8545
fi

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  # We define 10 accounts with balance 1M ether, needed for high-value tests.
  local accounts=(
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208,1000000000000000000000000"
    --account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209,1000000000000000000000000"
  )

  if [ "$SOLIDITY_COVERAGE" = true ]; then
    node_modules/.bin/ganache-sc --gasLimit 0xfffffffffff --port "$ganache_port" "${accounts[@]}" > /dev/null &
  else
    # use a gas limit high enough that the truffle cleanroom feature succeeds
    ${GANACHE} --gasLimit 6000000 "${accounts[@]}" > /dev/null &
  fi

  ganache_pid=$!
}

FLAGS=""
FILES=""
NETWORK=""
GET_NETWORK=0
for F in $@ ; do
    case $F in
	--network)
	    FLAGS="$FLAGS --network"
	    GET_NETWORK=1
	    ;;
	--compile-all | --verbose-rpc)
	    FLAGS="$FLAGS $F"
	    ;;
	*)
	    if test $GET_NETWORK = 1 ; then
		FLAGS="$FLAGS $F"
		GET_NETWORK=0
		NETWORK=$F
	    else
		FILES="$FILES $F"
	    fi
	    ;;
    esac
done

if test \( "x$NETWORK" = "x" \) -o \( "x$NETWORK" = "xdevelopment" \) ; then
    if ganache_running; then
	echo "Using existing ganache instance"
    else
	echo "Starting our own ganache instance"
	start_ganache
    fi
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  node_modules/.bin/solidity-coverage

  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
    CMD_ROOT="${TRUFFLE} test $FLAGS"

    if test "x$FILES" = "x" ; then
	FILES=$(ls test/*.js)
    fi

    for i in $FILES ; do
	echo "---- test: $i"
	${CMD_ROOT} "$i"
    done
fi
