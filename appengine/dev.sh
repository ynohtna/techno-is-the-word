#!/bin/sh
python /usr/local/bin/dev_appserver.py --datastore_path=./db/db.datastore --blobstore_path=./db/blobs --enable_sendmail true --require_indexes true .
