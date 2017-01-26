#!/bin/bash

################################
services="backend"
#services="angulask rest-mock"
com="git"
pull="$com pull"
current_branch="rethink"

$pull origin $current_branch
if [ "$?" != "0" ]; then exit 1; fi

for service in $services;
do
    echo "Repo '$service'"
    cd $service
    $pull
    if [ "$?" != "0" ]; then exit 1; fi
    cd ..
done

################################
# echo "Submodule sync"
# git submodule sync
# git submodule update

################################
cd containers
docker-compose \
    -f docker-compose.yml \
    -f custom/rethink.yml \
    -f development.yml \
    -f production.yml \
    pull

if [ "$?" != "0" ]; then exit 1; fi

################################
docker-compose run bower /bin/sh -c "bower update"

if [ "$?" != "0" ]; then exit 1; fi
