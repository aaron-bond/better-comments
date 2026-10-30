# ! Makefile: tags in comments, and the same characters outside them (#566)
URL = http://example.com/archive.tar.gz
VERSION ?= 1.0
# TODO: pin the version

all: build # ? after a target

build:
	curl http://example.com/archive.tar.gz -o out.tar.gz
	if [ "$(A)" != "$(B)" ]; then echo differ; fi # * after a recipe command
	@echo "# ! inside a string"

ifneq ($(A),$(B))
    # // indented comment
endif
