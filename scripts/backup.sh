#!/usr/local/bin/fish

set name (date "+%Y-%m-%d")
set local_path "/Users/projects/restapi/restangulask/backend/backup/serious"
mkdir -p $local_path
set remote_path "projects/restangulask/backend/backup"
set backupname "$local_path/baroque_$name.tar.gz"

echo "Backing up"
leaseweb docker exec -i containers_custombe_1 rethinkdb-dump -c rdb --file backup/latest.tar.gz --overwrite

echo "Saving"
rsync -av root@lease.dev:$remote_path/latest.tar.gz $backupname

echo "Completed"
ls -l $backupname

