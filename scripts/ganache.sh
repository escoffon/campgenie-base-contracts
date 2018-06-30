#! /usr/bin/env bash
# Cribbed from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/scripts/test.sh

# use the local ganache
GANACHE="node_modules/.bin/ganache-cli"
# use the global ganache
#GANACHE="ganache-cli"
GANACHE_PORT=8545
CHAIN_ID=416
# use a gas limit high enough that the truffle cleanroom feature succeeds
GAS_LIMIT=6000000
INIT=0
DB_DIR=""
HELP=0
FLAGS=""
MY_ACCOUNTS=1
LAST_OPT=""

for F in $@ ; do
    if test "x$LAST_OPT" != "x" ; then
	case $LAST_OPT in
	    --db) DB_DIR=$F
		  ;;
	    -i | --networkId) CHAIN_ID=$F
			      F=""
			      ;;
	    -p | --port) GANACHE_PORT=$F
			 ;;
	    -l | --gasLimit) GAS_LIMIT=$F
			     F=""
			     ;;
	esac
	FLAGS="$FLAGS $F "
	LAST_OPT=""
    else
	case "$F" in
	    -\?) HELP=1
	         LAST_OPT=""
		 F=""
	         ;;
	    --db | -p | --port) LAST_OPT="$F"
						   ;;
	    -l | --gasLimit | -i | --networkId) LAST_OPT="$F"
			     F=""
			     ;;
	    --accounts | --account=*) MY_ACCOUNTS=0
				    ;;
	    --init-db) INIT=1
	               ;;
	esac
	FLAGS="$FLAGS $F "
    fi
done

if test $HELP == 1 ; then
    echo "usage: $0 [-?] [--init-db] [ganache flags]"
    echo "  -?          Print help and exit."
    echo "  --init-db   Initialize the database: the database directory is removed before running."
    echo "              This option requires the --db option."
    echo ""
    echo " You can also pass the standard Ganache options, which will be passed to the ganache instance"
    echo " if one is started. If --accounts or --account are present, the ganache instance will use those"
    echo " flags instead of setting up the standard account values."
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
	    echo "--init-db requires --db"
	    exit 1
	else
	    rm -rf $DB_DIR
	fi
    fi

    if test $MY_ACCOUNTS = 1 ; then
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
    else
	local accounts=()
    fi
    
    if test "x$DB_DIR" == "x" ; then
	${GANACHE} $FLAGS -i $CHAIN_ID --gasLimit $GAS_LIMIT "${accounts[@]}"
    else
	mkdir -p $DB_DIR
	${GANACHE} $FLAGS -i $CHAIN_ID --gasLimit $GAS_LIMIT --db $DB_DIR "${accounts[@]}"
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
