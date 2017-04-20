# !/bin/sh

# DOMAIN="b2stage.cineca.it"
# MODE="--staging"
# MODE=""

# Renewall script
echo "Mode *$MODE* and DOMAIN $DOMAIN"
./acme.sh --issue --debug -d $DOMAIN -w $WWWDIR $MODE
echo "Completed. Check:"
./acme.sh --list

echo "Copy files"
cp $DOMAIN/$DOMAIN.key $CERTDIR/privkey1.pem
cp $DOMAIN/fullchain.cer $CERTDIR/fullchain1.pem

nginx -s reload