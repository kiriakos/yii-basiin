#! /bin/env bash

##
#   Basiin application, ads transfered data to an incomming file
#
# automatically overwrites data if a packet is resent.
# automatically pads the file if a packet is delivered out of send order
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

#dataSize is length of data string
dataSize=${#data}
paddChar="A"

##if file is shorter than startbyte pad
fileSize=$((`stat -c %s $fileName`)) # -1 removes the EOF char
#deprecated #if [ "${fileSize}" -eq -1 ]; then fileSize=0; fi

echo $fileSize
if [ $fileSize -lt $startByte ]; then
      echo 'padding file ('$(( $startByte - $fileSize ))' chars)';
      #generate dapping string
      padd=""
      for i in `seq $(( $startByte - $fileSize ))`; do padd="${padd}${paddChar}"; done
      echo -n $padd >> $fileName # -e to avoid \n injection
fi

##put the data into the file

if [ $fileSize -eq 0 ] && [ $startByte -eq 0 ]; then
    echo "$data > $fileName"
    echo -n "$data" > $fileName
else
    echo "$data"
    echo "s/(.{,"${startByte}"})0{,"${dataSize}"}(.*)/\1"${data}"\2/" "$fileName"
    sed -i -r "s/(.{"${startByte}"}).{,"${dataSize}"}(.*)/\1""${data}""\2/" "$fileName"
fi

    
    
    
    
