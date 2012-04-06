#! /bin/env bash

#script's DIR
DIR=$(cd $(dirname "$0"); pwd);

#mount
su - -c "umount $DIR/../data;
         umount $DIR/../incomming;
         umount $DIR/../received;"

