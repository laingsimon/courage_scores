#! /bin/bash

echo Run this command to get dotnet to create a 1yr valid local self-signed certificate
echo dotnet dev-certs https --trust

# On windows.
# Export the localhost certificate, including the private key.
# Make a note of the password provided during export.
# Save the file as localhost.pfx in this directory.

openssl pkcs12 -in localhost.pfx -nocerts -out server.key.enc
openssl rsa -in server.key.enc -out server.key
openssl pkcs12 -in localhost.pfx -clcerts -nokeys -out server.crt
rm server.key.enc
cp server.key server.pem
cat server.crt >> server.pem

echo Copying certificate to webpack server
mv ../node_modules/.cache/webpack-dev-server/server.pem ../node_modules/.cache/webpack-dev-server/server.pem.old
cp server.pem ../node_modules/.cache/webpack-dev-server/server.pem

rm server.key
rm server.crt
