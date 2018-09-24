terraform {
  backend "s3" {
    bucket = "<%= clusterDomain %>"
    key    = "terraform__<%= clusterDomain %>"
    region = "<%= region %>"
  }
}

resource "aws_ecr_repository" "service" {
  name = "<%= clusterDomain %>"
}
