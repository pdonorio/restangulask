#!/usr/local/bin/fish

set name (date "+%Y-%m-%d")
set local_path "/Users/projects/restapi/restangulask/backend/backup/serious"
mkdir -p $local_path

set remote_path "projects/restangulask/backend/backup"
set backupname "$local_path/baroque_$name.tar.gz"
set elastic_path "/usr/share/elasticsearch/data/elasticsearch/nodes"
set elastic_container "containers_searchindex_1"

echo "Backing up rethinkdb"
leaseweb docker exec -i containers_custombe_1 rethinkdb-dump -c rdb --file backup/latest.tar.gz --overwrite

# echo "Backing up elasticsearch"
# leaseweb docker run --rm \
#     --volumes-from $elastic_container -v (pwd):/mybackup \
#     ubuntu tar cvf /mybackup/elastic.tar $elastic_path

echo "Saving"
rsync -av root@lease.dev:$remote_path/latest.tar.gz $backupname
rsync -av root@lease.dev:~/elastic.tar $local_path/

# echo "Restore elastic"
# docker run --rm \
#     --volumes-from $elastic_container -v $local_path:/mybackup ubuntu \
#     bash -c "cd $elastic_path && tar xvf /mybackup/elastic.tar --strip 1"

# docker restart $elastic_container

echo "Completed"
ls -l $backupname

