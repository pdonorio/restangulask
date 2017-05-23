# !/bin/bash
set -e

# DOMAIN="b2stage.cineca.it"
# MODE="--staging"
# MODE=""

# Renewall script
echo "Mode: *$MODE*"
echo "Domain: $DOMAIN"

./acme.sh --issue --debug \
    --fullchain-file $CERTDIR/fullchain1.pem \
    --key-file $CERTDIR/privkey1.pem \
    -d $DOMAIN -w $WWWDIR $MODE

if [ "$?" == "0" ]; then
    # List what we have
    echo "Completed. Check:"
    ./acme.sh --list

    nginx -s reload
else
    echo "ACME FAILED!"
fi

# # Renewall script
# echo "Mode *$MODE* and DOMAIN $DOMAIN"
# ./acme.sh --issue --debug -d $DOMAIN -w $WWWDIR $MODE
# echo "Completed. Check:"
# ./acme.sh --list

# echo "Copy files"
# cp $DOMAIN/$DOMAIN.key
# cp $DOMAIN/fullchain.cer

# nginx -s reload
