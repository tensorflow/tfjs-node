
body="{
\"request\": {
  \"branch\":\"$REPO_NAME\"
  }
}"

echo "body: ${body}"

curl -s -X POST \
   -H "Content-Type: application/json" \
   -H "Accept: application/json" \
   -H "Travis-API-Version: 3" \
   -H "Authorization: token INKvoqirQIBD805HgU3Gew" \
   -d "$body" \
   https://api.travis-ci.org/repo/tensorflow%2Ftfjs-node/requests

# echo "Trying request $1"

# curl -s -X GET \
#    -H "Content-Type: application/json" \
#    -H "Accept: application/json" \
#    -H "Travis-API-Version: 3" \
#    -H "Authorization: token INKvoqirQIBD805HgU3Gew" \
#    -d "{}" \
#    https://api.travis-ci.org/repo/tensorflow%2Ftfjs-node/request/$1

