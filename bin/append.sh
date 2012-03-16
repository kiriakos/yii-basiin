#! /bin/env bash

##
#   DEPRECATED! basiin uses PHP's file operations as long as there 
#
#
#   Basiin application, ads transfered data to an incomming file
#
#   new version as of March 9 2012. This version ensures atomic actions on the
#   incomming file by waiting untill the file grws exactly to $startByte -1 
#   bytes. This means that only appends are being made and that a lot of packets 
#   can fail or time out.
##

exit 1 #DEPRECATED

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

echo "${#data} chars"
echo -ne "$data" >> $fileName
result=$?
    
#exit with the value of the write command
exit $result
