#! /bin/env bash

#script's DIR
DIR=$(cd $(dirname "$0"); pwd);
DBSize=20m
StoreSize=200m
Uid=500 ##apache's or your user's user id
Gid=48 ##apache's group ID

## Creates and mounts the tempfs filesystems needed for basiin's better
#  performance.

## Add these mount points to your /etc/fstab file if you want automated mounting
#  of the tmpfs to the directories.

#dirs: data, incomming, received

#clean
rm -i $DIR/../data/* $DIR/../incomming/* $DIR/../received/*


#mount ramdisks (tempfss)
echo "You need to be root to mount tempfs structures, please provide the root passordwd"
su - -c "mount -t tmpfs -o size=$DBSize,uid=$Uid,gid=$Gid tmpfs $DIR/../data;
         mount -t tmpfs -o size=$StoreSize,uid=$Uid,gid=$Gid tmpfs $DIR/../incomming;
         mount -t tmpfs -o size=$StoreSize,uid=$Uid,gid=$Gid tmpfs $DIR/../received;"

#cp db
cp "$DIR/../settup/basiin.db" "$DIR/../data/"
chmod -R ug+w "$DIR/../data"
chmod -R ug+w "$DIR/../incomming"
chmod -R ug+w "$DIR/../received"
