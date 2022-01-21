Using debian as the OS since it seems the most compatible for build environments
Generally using -buster- for backwards compatibility
*There is a bug with openssl on arm macs (apple silicon M1 arm64 chips) with less than bullseye or ubuntu 21
 so we will be using bullseye instead
using the buildpack-deps images as the base since it includes many common packages to almost all dev containers

todo: 
add vscode and extension install to docker images

add vs code dockerfile layers and pre-build base images without vsc- prefix

build options

build single/multiple/all containers

docker compose

scripts (download instead of copy from working dir?)

passing docker push credentials to build container

would docker-from-docker be better for building?

cleanup scripts from orphaned images - build script errors,dockerfile error, docker compose error, devcontainer build error, vscode container launch errors

remove apt install added by parent images

add github extension

shared volume caches