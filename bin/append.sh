#! /bin/env bash

##
#   Basiin application, ads transfered data to an incomming file
#
#   new version as of March 9 2012. This version ensures atomic actions on the
#   incomming file by waiting untill the file grws exactly to $startByte -1 
#   bytes. This means that only appends are being made and that a lot of packets 
#   can fail or time out.
##


##
#   Needs 3 params 
# $1 =  file name (file is in ../incomming)
fileName="$1"
# $2 =  start byte (character) the point to which to append the data
#       first char is indexed 0 not 1
startByte=$2
# $3 =  data to be apppended
data=$3
##

maxSleep=20 # 2 seconds of 100ms intervals

#dataSize is length of data string
dataSize=${#data}
paddChar="A"

##if file is shorter than startbyte pad
fileSize=$((`stat -c %s $fileName`)) # -1 removes the EOF char

#wait your turn to come packet
while [ $fileSize -lt $startByte ]; do
    if [ $maxSleep -eq 0 ]; then
        echo "wait time over I failed"
        exit 1;
    fi
    
    sleep 0.1
    maxSleep=$(($maxSleep-1)) #reduce the time remaining
    fileSize=$((`stat -c %s $fileName`)) # update the filesize
done

##put the data into the file
if [ $fileSize -eq $startByte ]; then
    echo "$data >> $fileName"
    echo -n "$data" >> $fileName
    result=$?
else
    echo "file outgrew me, I failed"
    exit 1
fi

#exit with the value of the write command
exit $result
