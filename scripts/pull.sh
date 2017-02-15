#!/bin/bash

################################
services="backend"
#services="angulask rest-mock"
com="git"
pull="$com pull"
current_branch="rethink"

$pull origin $current_branch
if [ "$?" != "0" ]; then exit 1; fi

for service in $services;
do
    echo "Repo '$service'"
    cd $service
    $pull
    if [ "$?" != "0" ]; then exit 1; fi
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
cd ..

################################
pwd
echo "Starting production"
scripts/boot.sh rethink production
if [ "$?" != "0" ]; then exit 1; fi
sleep 5

echo "Restarting backend"
docker restart containers_custombe_1
if [ "$?" != "0" ]; then exit 1; fi

# in case you want to reload the blog
# cd ~/projects/pilewf && docker-compose -f blog.yml stop && docker-compose -f blog.yml rm -f && docker-compose -f blog.yml up -d

echo "Rebuild index in background"
docker exec -t containers_custombe_1 /bin/sh -c "python3.6 operations.py" &
