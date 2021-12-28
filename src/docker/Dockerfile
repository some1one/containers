FROM some1one/containers:vsc-node

RUN  export DEBIAN_FRONTEND=noninteractive \
    # use awk and /etc/os-release to get OS info
    && export ID=$(awk -F= '$1=="ID" { print $2 }' /etc/os-release) \
    && export VERSION_CODENAME=$(awk -F= '$1=="VERSION_CODENAME" { print $2 }' /etc/os-release) \
    #set up docker apt repo
    && curl -fsSL https://download.docker.com/linux/${ID}/gpg | gpg --dearmor > /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list \
    #install docker-ce-cli and docker compose dependencies
    && apt-get update && apt-get install --no-install-recommends docker-ce-cli \
        python3-minimal \
        python3-pip \
        libffi-dev \
        python3-venv \
        socat \
    #create tmp pip env to install docker compose
    && export PIPX_HOME=/usr/local/pipx \
    && mkdir -p ${PIPX_HOME} \
    && export PIPX_BIN_DIR=/usr/local/bin \
    && export PYTHONUSERBASE=/tmp/pip-tmp \
    && export PIP_CACHE_DIR=/tmp/pip-tmp/cache \
    && pip3 install --no-warn-script-location --disable-pip-version-check --no-cache-dir --user pipx \
    #install docker-compose
    && /tmp/pip-tmp/bin/pipx install --pip-args '--no-cache-dir --force-reinstall' docker-compose \
    #cleanup
    && rm -rf /tmp/pip-tmp

#setup sockets and init scripts
ARG USERNAME="vscode"
RUN touch "/var/run/docker-host.sock" \
    && ln -s "/var/run/docker-host.sock" "/var/run/docker.sock" \
    && chown -h "${USERNAME}":root "/var/run/docker.sock" \
    && printf \
'#!/usr/bin/env bash \n\
#------------------------------------------------------------------------------------------------------------- \n\
# Copyright (c) Microsoft Corporation. All rights reserved. \n\
# Licensed under the MIT License. See https://go.microsoft.com/fwlink/?linkid=2090316 for license information. \n\
#------------------------------------------------------------------------------------------------------------- \n\
set -e \n\
SOCAT_PATH_BASE=/tmp/vscr-docker-from-docker \n\
SOCAT_LOG=${SOCAT_PATH_BASE}.log \n\
SOCAT_PID=${SOCAT_PATH_BASE}.pid \n\
# Wrapper function to only use sudo if not already root \n\
sudoIf() \n\
{ \n\
    if [ "$(id -u)" -ne 0 ]; then \n\
        sudo "$@" \n\
    else \n\
        "$@" \n\
    fi \n\
} \n\
# Log messages \n\
log() \n\
{ \n\
    echo -e "[$(date)] $@" | sudoIf tee -a ${SOCAT_LOG} > /dev/null \n\
} \n\
echo -e "\n** $(date) **" | sudoIf tee -a ${SOCAT_LOG} > /dev/null \n' \
    >> /usr/local/share/docker-init.sh \
    && echo "log 'Ensuring ${USERNAME} has access to /var/run/docker-host.sock via /var/run/docker.sock'" >> /usr/local/share/docker-init.sh \
    && printf \
'# If enabled, try to add a docker group with the right GID. If the group is root,  \n\
# fall back on using socat to forward the docker socket to another unix socket so  \n\
# that we can set permissions on it without affecting the host. \n\
SOCKET_GID=$(stat -c '%g' /var/run/docker-host.sock) \n\
if [ "${SOCKET_GID}" != "0" ]; then \n\
    log "Adding user to group with GID ${SOCKET_GID}." \n\
    if [ "$(cat /etc/group | grep :${SOCKET_GID}:)" = "" ]; then \n\
        sudoIf groupadd --gid ${SOCKET_GID} docker-host \n\
    fi \n\
    # Add user to group if not already in it \n\
    if [ "$(id ${USERNAME} | grep -E "groups.*(=|,)${SOCKET_GID}\(")" = "" ]; then \n' \
        >> /usr/local/share/docker-init.sh \
        && echo "sudoIf usermod -aG \${SOCKET_GID} ${USERNAME}" >> /usr/local/share/docker-init.sh \
        && printf \
'    fi \n\
else \n\
    # Enable proxy if not already running \n\
    if [ ! -f "${SOCAT_PID}" ] || ! ps -p $(cat ${SOCAT_PID}) > /dev/null; then \n\
        log "Enabling socket proxy." \n\
        log "Proxying /var/run/docker-host.sock to /var/run/docker.sock for vscode" \n\
        sudoIf rm -rf /var/run/docker.sock \n' \
        >> /usr/local/share/docker-init.sh \
        && echo "(sudoIf socat UNIX-LISTEN:/var/run/docker.sock,fork,mode=660,user=${USERNAME} UNIX-CONNECT:/var/run/docker-host.sock 2>&1 | sudoIf tee -a \${SOCAT_LOG} > /dev/null & echo '\$!' | sudoIf tee \${SOCAT_PID} > /dev/null)" >> /usr/local/share/docker-init.sh \
        && printf \
'   else \n\
        log "Socket proxy already running." \n\
    fi \n\
fi \n\
# Execute whatever commands were passed in (if any). This allows us  \n\
# to set this script to ENTRYPOINT while still executing the default CMD. \n\
set +e \n\
exec "$@" \n\
' \
    >> /usr/local/share/docker-init.sh \
    && chmod +x /usr/local/share/docker-init.sh \
    && chown ${USERNAME}:root /usr/local/share/docker-init.sh \
    #install devcontainer build tools
    && export NVM_DIR="/usr/local/share/nvm" \
    && export NODE_VERSION="${NODE_VERSION}" \
    && export NVM_SYMLINK_CURRENT=true \
    && su ${USERNAME} -c "source ${NVM_DIR}/nvm.sh && npm install -g @vscode/dev-container-cli"