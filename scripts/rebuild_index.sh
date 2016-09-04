#!/bin/bash

remote="ssh root@lease.dev"
com="docker exec -it containers_custombe_1 python3 operations.py"

echo "Building $1"

if [ "$1" == "remote" ]; then
    $remote "$com"
else
    $com
fi
