Using debian as the OS since it seems the most compatible for build environments
Generally using buster for backwards compatibility
using the buildpack-deps images as the base since it includes the basic packages common to almost all dev containers

todo: 
add vscode and extension install to docker images

add vs code dockerfile layers and seperate base images without vsc- prefix

build options

build single/multiple/all containers

docker compose

scripts (download instead of copy from working dir?)

passing docker push credentials to build container

would docker-from-docker be better for building?

cleanup scripts from orphaned images - build script errors,dockerfile error, docker compose error, devcontainer build error, vscode container launch errors

remove apt install added by parent images