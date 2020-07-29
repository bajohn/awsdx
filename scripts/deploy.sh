#!/bin/bash
DIR=`pwd`
SITE_PACKAGES_REL=/lib/python3.8/site-packages
mkdir -p temp/python$SITE_PACKAGES_REL
TEMP=$DIR/temp/python$SITE_PACKAGES_REL
cd $DIR

SITE_PACKAGES=$(pipenv --venv)
PACKAGE_ZIP='awsdx_lib.zip'

OUTDIR=$DIR/out

for var in "$@"
do
    case $var in
        --libs=*)
            DEPLOY_LIBS="${var#*=}"
            if [ "$DEPLOY_LIBS" == "true" ] 
            then 
                echo "Deploying Libs"
                cd $SITE_PACKAGES$SITE_PACKAGES_REL

                cp -r ./ $TEMP

                cd $TEMP 
                cd ../../../../
                pwd
                zip -rX $OUTDIR/$PACKAGE_ZIP *

            fi
        ;;
    esac
done



cd $DIR/lambdas
for file_outer in ./** #separate zip for each lambda
do
    cd $DIR
    len=${#file_outer}

    shortfile=${file_outer:2:len-5} # change this to "not have the .py" exclude last 3 characters


    zip -rX $OUTDIR/$shortfile.zip ./lambdas
    

done 

rm -r $DIR/temp

S3_BUCKET_NAME='awsdx-lambda-code-bucket'


file_prefix='./out/'
prefix_len=${#file_prefix}
for file_inner in $file_prefix** #separate zip for each lambda
do
    if [ "$DEPLOY_LIBS" == "true" ] || [ "$file_inner" != "$file_prefix$PACKAGE_ZIP" ]
    then 
        suffix_len=${#file_inner}
        S3_KEY=${file_inner:prefix_len:suffix_len-prefix_len} # change this to "not have the .py" exclude last 3 characters
        aws s3 cp $file_inner s3://$S3_BUCKET_NAME/$S3_KEY
    fi
done

cd terraform
terraform apply -auto-approve 