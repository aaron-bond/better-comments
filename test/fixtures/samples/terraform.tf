# ! An AMI
variable "ami" {
  description = "the AMI to use"
}

/** 
  * A multi
  * ? line comment 
  */
resource "aws_instance" "web" {
  ami               = "${var.ami}"
  count             = 2
  source_dest_check = false

  connection {
    user = "root"
  }
}



# ! hello
// ! hello
/*
 ! hello
*/