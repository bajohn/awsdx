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
  timeout = 60 # timeout in seconds. 
  memory_size = 256
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

resource "aws_iam_policy_attachment" "iam_for_lambda_data_exchange_attach" {
  name       = "AWSDX Data Exchange Policy"
  roles      = [aws_iam_role.iam_for_lambda_default.name]
  policy_arn = "arn:aws:iam::aws:policy/AWSDataExchangeFullAccess"
}

resource "aws_iam_policy_attachment" "iam_for_lambda_athena_attach" {
  name       = "Athena Exchange Policy"
  roles      = [aws_iam_role.iam_for_lambda_default.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonAthenaFullAccess"
}

resource "aws_iam_policy_attachment" "iam_for_lambda_s3_attach" {
  name       = "S3 Exchange Policy"
  roles      = [aws_iam_role.iam_for_lambda_default.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
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










variable "domain-name" {
    default="ship-flow.io"
}


variable "bucket-name" {
    default="ship-flow"
}

variable "region" {
    default="us-east-1"
}




resource "aws_cloudfront_distribution" "website_distribution" {
  origin {
    domain_name = "${var.bucket-name}.s3.amazonaws.com"
    origin_id   =  "${var.domain-name}-s3-origin" 
  }
  aliases = [ var.domain-name]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.domain-name}-s3-origin"  

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
  }
  enabled         = true
  is_ipv6_enabled = true
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.website_cert.arn
    minimum_protocol_version = "TLSv1.1_2016"
    ssl_support_method       = "sni-only"
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}


resource "aws_route53_record" "website_record_a" {
  zone_id = aws_route53_zone.website_zone.zone_id
  name    =  var.domain-name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.website_distribution.hosted_zone_id 
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "website_record_aaaa" {
  zone_id = aws_route53_zone.website_zone.zone_id
  name    = var.domain-name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.website_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.website_distribution.hosted_zone_id 
    evaluate_target_health = false
  }
}


resource "aws_route53_zone" "website_zone" {
  name    =  var.domain-name
  comment = ""
}


resource "aws_s3_bucket" "website_bucket" {
  bucket = var.bucket-name
  acl    = "private"
  website {
    error_document = "index.html"
    index_document = "index.html"
  }
}

resource "aws_acm_certificate" "website_cert" {
  domain_name       =  var.domain-name
  validation_method = "DNS"

}
