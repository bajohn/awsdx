locals {
    lib_filename = "awsdx_lib.zip"
}


provider "aws" {
  profile = "default"
  region  = "us-east-1"
  version = "2.57.0"
}

resource "aws_lambda_function" "data_agg_lambda" {
  s3_bucket = "awsdx-lambda-code-bucket"
  s3_key = "data_aggregation.zip"
  function_name    = "awsdx-data-agg"
  role             = aws_iam_role.iam_for_lambda_default.arn
  handler          = "lambdas/data_aggregation.handler"
  layers  = [aws_lambda_layer_version.lib_layer.arn]
  runtime = "python3.8"
  source_code_hash = filebase64sha256("../out/data_aggregation.zip")
  timeout = 10 # timeout in seconds. Is typically below 2 seconds, average around 600ms.
}

resource "aws_iam_role" "iam_for_lambda_default" {
  name = "iam_for_lambda_default"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_layer_version" "lib_layer" {
  s3_bucket = "awsdx-lambda-code-bucket"
  s3_key = local.lib_filename 
  layer_name = "awsdx-libs"

  compatible_runtimes = ["python3.7"]
}


resource "aws_s3_bucket" "awsdx_data_bucket" {
  bucket = "awsdx-data-bucket"
}

resource "aws_athena_database" "awsdx_db" {
  name   = "awsdx_db"
  bucket = aws_s3_bucket.awsdx_data_bucket.bucket
}