FROM some1one/containers:vsc-node


RUN  export DEBIAN_FRONTEND=noninteractive \
    # use awk and /etc/os-release to get OS info
    && export ID=$(awk -F= '$1=="ID" { print $2 }' /etc/os-release) \
    && export VERSION_CODENAME=$(awk -F= '$1=="VERSION_CODENAME" { print $2 }' /etc/os-release) \
    #set up docker apt repo
    && curl -fsSL https://download.docker.com/linux/${ID}/gpg | gpg --dearmor > /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list \
    #install docker-ce-cli and docker compose dependencies
    && apt-get update && apt-get install --no-install-recommends -y \
        lxc \
        pigz \
        iptables \
        docker-ce \
        docker-ce-cli \
        python3-minimal \
        python3-pip \
        libffi-dev \
        python3-venv \
    #use legacy iptables
    && update-alternatives --set iptables /usr/sbin/iptables-legacy \
    && update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy \
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

#setup docker user and init script
ARG USERNAME="vscode"
RUN usermod -aG docker ${USERNAME} \
    && echo '#!/bin/sh\nset -e\ndockerd_start="' >> /usr/local/share/docker-init.sh \
    && echo "\$(cat << 'END'" >> /usr/local/share/docker-init.sh \
    && echo "    find /run /var/run -iname 'docker*.pid' -delete || :" \
    >> /usr/local/share/docker-init.sh \
    && echo "    find /run /var/run -iname 'container*.pid' -delete || :" \
    >> /usr/local/share/docker-init.sh \
    && printf '    export container=docker\n\
    if ! mountpoint -q /tmp; then\n\
        mount -t tmpfs none /tmp\n\
    fi\n\
    if [ -f /sys/fs/cgroup/cgroup.controllers ]; then\n\
        mkdir -p /sys/fs/cgroup/init\n\
        xargs -rn1 < /sys/fs/cgroup/cgroup.procs > /sys/fs/cgroup/init/cgroup.procs || :\n' \
    >> /usr/local/share/docker-init.sh \
    && echo "        sed -e 's/ / +/g' -e 's/^/+/' < /sys/fs/cgroup/cgroup.controllers \\" \
    >> /usr/local/share/docker-init.sh \
    && echo '            > /sys/fs/cgroup/cgroup.subtree_control\n\
    fi\n\
    set -e\n\
    ( dockerd > /tmp/dockerd.log 2>&1 ) &\n\
END\n\
)"\n\
if [ "$(id -u)" -ne 0 ]; then\n\
    sudo /bin/sh -c "${dockerd_start}"\n\
else\n\
    eval "${dockerd_start}"\n\
fi\n\
set +e\n\
exec "$@"'\
    >> /usr/local/share/docker-init.sh \
    && chmod +x /usr/local/share/docker-init.sh \
    && chown ${USERNAME}:root /usr/local/share/docker-init.sh \
    #install devcontainer build tools
    && export NVM_DIR="/usr/local/share/nvm" \
    && export NODE_VERSION="${NODE_VERSION}" \
    && export NVM_SYMLINK_CURRENT=true \
    && su ${USERNAME} -c "source ${NVM_DIR}/nvm.sh && npm install -g @vscode/dev-container-cli"

# Setting the ENTRYPOINT to docker-init.sh will start up the Docker Engine 
# The script will also execute CMD if you need to alter startup behaviors.
ENTRYPOINT [ "/usr/local/share/docker-init.sh" ]
CMD [ "sleep", "infinity" ]