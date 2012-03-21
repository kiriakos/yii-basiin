#! /bin/env bash

#mergeFiles.sh
fileName=$1
baseDir=$2
pidFile="${baseDir}/incomming/${fileName}.pid"

echo $fileName
echo ${baseDir}
echo $$

#if pid file exists and process exists
if [ -f  "${pidFile}" ] && kill -0 `cat "${pidFile}"` ; then
    echo "$$ mergeFiles ${fileName}: another process is already operating on this file"
    exit 1
else
    echo $$ > $pidFile    
fi

#catenate the files together (sorted)
cat `find "${baseDir}/incomming/" | grep ${fileName}.packet | sort -V` > "${baseDir}/recieved/${fileName}"

#remove all incomming files
rm "${baseDir}/incomming/${fileName}*"

exit 0;
