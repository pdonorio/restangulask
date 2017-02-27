#!/bin/bash

in=$1
bc="containers_custombe_1"
fc="containers_customfe_1"

dc="docker exec -it"
boot="./boot devel"

if [ "$in" == "back" ]; then
    $dc $bc $boot
elif [ "$in" == "front" ]; then
    $dc $fc $boot
elif [ "$in" == "restore" ]; then
    scripts/backup.sh
    scripts/restore.sh
    $dc $bc python3.6 operations.py
elif [ "$in" == "backshell" ]; then
    $dc $bc bash
else
    echo "Unknown command: $in"
fi