#! /usr/bin/env bash
# Cribbed from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/scripts/test.sh

echo $0

# use the local ganache
GANACHE="node_modules/.bin/ganache-cli"
# use the global ganache
#GANACHE="ganache-cli"
GANACHE_PORT=8545
CHAIN_ID=416
INIT=0
DB_DIR=""
HELP=0

OPTSTRING="hn:d:i"
MORE=1
while test $MORE == 1 ; do
    getopts $OPTSTRING opt
    if test $opt == '?' ; then
	MORE=0
    else
	case $opt in
	    h) HELP=1
		;;
	    n) CHAIN_ID=$OPTARG
		;;
	    d) DB_DIR="$OPTARG"
		;;
	    i) INIT=1
		;;
	esac
    fi
done

if test $HELP == 1 ; then
    echo "usage: $0 [-h] [-n CHAIN_ID] [-d DB_DIR] [-i]"
    echo "  -h          Print help and exit"
    echo "  -n CHAIN_ID Set the network ID for private chain use (defaults to 416)"
    echo "  -d DB_DIR   The directory where to store the database (defaults to no database persisted)"
    echo "  -i          Initialize the database: the database directory is removed before running"
    exit 0
fi

# Executes cleanup function at script exit.
trap cleanup EXIT
trap cleanup KILL

cleanup() {
 # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
      echo "stopping..."
    kill -9 $ganache_pid
  fi
}

ganache_running() {
  nc -z localhost "$GANACHE_PORT"
}

start_ganache() {
    if test $INIT == 1 ; then
	if test "x$DB_DIR" == "x" ; then
	    echo "-i requires -d"
	    exit 1
	else
	    rm -rf $DB_DIR
	fi
    fi

    # We define 10 accounts with balance 100 ether
    local accounts=(
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208,100000000000000000000"
	--account="0x4bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209,100000000000000000000"
    )

    # use a gas limit high enough that the truffle cleanroom feature succeeds

    if test "x$DB_DIR" == "x" ; then
	${GANACHE} -i ${CHAIN_ID} --gasLimit 6000000 "${accounts[@]}"
    else
	mkdir -p $DB_DIR
	${GANACHE} -i ${CHAIN_ID} --gasLimit 6000000 --db $DB_DIR "${accounts[@]}"
    fi

    ganache_pid=$!
}

if ganache_running; then
  echo "ganache instance already running"
  start_ganache
else
  echo "Starting ganache instance at network id ${CHAIN_ID}"
  start_ganache
fi
