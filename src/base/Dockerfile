FROM buildpack-deps:bullseye

#note, we install the github cli but we DO NOT install the git credential manager as 
#the configuration and credentials should be passed from the vs code host

#setup os/apt
RUN export DEBIAN_FRONTEND=noninteractive \
    # Remove imagemagick due to https://security-tracker.debian.org/tracker/CVE-2019-10131
    && apt-get purge -y imagemagick imagemagick-6-common \
    #update apt repos
    && apt-get update \
    #install apt-utils, readline, and locals to prevent some error messages and wget
    #disable apt-utils error message for itself until it is installed
    #disable apt-utils warning until it is installed
    && mv /etc/apt/apt.conf.d/70debconf . \
    && apt-get -y install --no-install-recommends apt-utils libreadline8 locales \
    && mv 70debconf /etc/apt/apt.conf.d \
    # Ensure at least the en_US.UTF-8 UTF-8 locale is available.
    && echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen \
    && locale-gen \
    #setup timezone
    && ln -snf /usr/share/zoneinfo/$(curl https://ipapi.co/timezone) /etc/localtime \
    && apt-get -y install --no-install-recommends tzdata \
    && dpkg-reconfigure --frontend noninteractive tzdata \
    #upgrade system packages
    && apt-get -y upgrade --no-install-recommends

#install software
RUN export DEBIAN_FRONTEND=noninteractive \
    #set up github cli repo
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor > /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    #install required, security, dev etc packages and tools 
    && apt-get update && apt-get -y install --no-install-recommends \
        openssh-server \
        gnupg2 \
        iproute2 \
        lsof \
        htop \
        net-tools \
        psmisc \
        rsync \
        tar \
        zip \
        nano \
        vim-tiny \
        less \
        jq \
        lsb-release \
        apt-transport-https \
        dialog \
        libc6 \
        libgcc1 \
        libkrb5-3 \
        libgssapi-krb5-2 \
        libicu[0-9][0-9] \
        liblttng-ust0 \
        libstdc++6 \
        zlib1g \
        sudo \
        ncdu \
        man-db \
        strace \
        manpages \
        manpages-dev \
        init-system-helpers \
        libssl1.1 \
        software-properties-common \
        gh \
    #cleanup
    && apt-get autoremove -y

#setup user, add code/insiders shim
ARG USERNAME="vscode"
RUN export DEBIAN_FRONTEND=noninteractive \
    # Ensure that login shells get the correct path if the user updated the PATH using ENV.
    && rm -f /etc/profile.d/00-restore-env.sh \
    && printf 'export PATH=${PATH//$(sh -lc "echo $PATH")/$PATH}' > /etc/profile.d/00-restore-env.sh \
    && chmod +x /etc/profile.d/00-restore-env.sh \
    # Create a non-root user and UID/GID.
    && groupadd $USERNAME \
    && useradd -s /bin/bash --gid $USERNAME -m $USERNAME \
    # Add add sudo support for non-root user
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    # Create default bashrc and profile
    && cp /etc/skel/.bashrc "/home/$USERNAME/.bashrc" \
    && cp /etc/skel/.profile "/home/$USERNAME/.profile" \
    \
    # Add RC snippet
    && printf '\n\
if [ -z "${USER}" ]; then export USER=$(whoami); fi \n\
if [[ "${PATH}" != *"$HOME/.local/bin"* ]]; then export PATH="${PATH}:$HOME/.local/bin"; fi \n\
\n\
# Display optional first run image specific notice if configured and terminal is interactive \n\
if [ -t 1 ] && [[ "${TERM_PROGRAM}" = "vscode" || "${TERM_PROGRAM}" = "codespaces" ]] && [ ! -f "$HOME/.config/vscode-dev-containers/first-run-notice-already-displayed" ]; then \n\
    if [ -f "/usr/local/etc/vscode-dev-containers/first-run-notice.txt" ]; then \n\
        cat "/usr/local/etc/vscode-dev-containers/first-run-notice.txt" \n\
    elif [ -f "/workspaces/.codespaces/shared/first-run-notice.txt" ]; then \n\
        cat "/workspaces/.codespaces/shared/first-run-notice.txt" \n\
    fi \n\
    mkdir -p "$HOME/.config/vscode-dev-containers" \n\
    # Mark first run notice as displayed after 10s to avoid problems with fast terminal refreshes hiding it \n\
    ((sleep 10s; touch "$HOME/.config/vscode-dev-containers/first-run-notice-already-displayed") &) \n\
fi \n\
\n\
# Set the default git editor if not already set \n\
if [ -z "$(git config --get core.editor)" ] && [ -z "${GIT_EDITOR}" ]; then \n\
    if  [ "${TERM_PROGRAM}" = "vscode" ]; then \n\
        if [[ -n $(command -v code-insiders) &&  -z $(command -v code) ]]; then  \n\
            export GIT_EDITOR="code-insiders --wait" \n\
        else \n\
            export GIT_EDITOR="code --wait" \n\
        fi \n\
    fi \n\
fi\n' \
    >> /etc/bash.bashrc \
    #finish updating bashrc
    && echo 'export PROMPT_DIRTRIM=4' >> "/home/$USERNAME/.bashrc" \
    && echo 'export PROMPT_DIRTRIM=4' >> "/root/.bashrc" \
    && chown ${USERNAME}:${USERNAME} "/home/$USERNAME/.bashrc" \
    # code shim, it fallbacks to code-insiders if code is not available
    && printf \
'#!/bin/sh \n\
\n\
get_in_path_except_current() { \n\
    which -a "$1" | grep -A1 "$0" | grep -v "$0" \n\
} \n\
\n\
code="$(get_in_path_except_current code)" \n\
\n\
if [ -n "$code" ]; then \n\
    exec "$code" "$@" \n\
elif [ "$(command -v code-insiders)" ]; then \n\
    exec code-insiders "$@" \n\
else \n\
    echo "code or code-insiders is not installed" >&2 \n\
    exit 127 \n\
fi \n\' \
    >> /usr/local/bin/code \
    && chmod +x /usr/local/bin/code \
    #copy meta info
    && printf \
'#!/bin/sh \n\
. /usr/local/etc/vscode-dev-containers/meta.env \n\
\n\
# Minimal output \n\
if [ "$1" = "version" ] || [ "$1" = "image-version" ]; then \n\
    echo "${VERSION}" \n\
    exit 0 \n\
elif [ "$1" = "release" ]; then \n\
    echo "${GIT_REPOSITORY_RELEASE}" \n\
    exit 0 \n\
elif [ "$1" = "content" ] || [ "$1" = "content-url" ] || [ "$1" = "contents" ] || [ "$1" = "contents-url" ]; then \n\
    echo "${CONTENTS_URL}" \n\
    exit 0 \n\
fi \n\
\n\
#Full output \n\
echo \n\
echo "Development container image information" \n\
echo \n\
if [ ! -z "${VERSION}" ]; then echo "- Image version: ${VERSION}"; fi \n\
if [ ! -z "${DEFINITION_ID}" ]; then echo "- Definition ID: ${DEFINITION_ID}"; fi \n\
if [ ! -z "${VARIANT}" ]; then echo "- Variant: ${VARIANT}"; fi \n\
if [ ! -z "${GIT_REPOSITORY}" ]; then echo "- Source code repository: ${GIT_REPOSITORY}"; fi \n\
if [ ! -z "${GIT_REPOSITORY_RELEASE}" ]; then echo "- Source code release/branch: ${GIT_REPOSITORY_RELEASE}"; fi \n\
if [ ! -z "${BUILD_TIMESTAMP}" ]; then echo "- Timestamp: ${BUILD_TIMESTAMP}"; fi \n\
if [ ! -z "${CONTENTS_URL}" ]; then echo && echo "More info: ${CONTENTS_URL}"; fi \n\
echo' \
    > /usr/local/bin/devcontainer-info \
    && chmod +x /usr/local/bin/devcontainer-info

#setup sshd server
ARG SSH_PORT="22"
RUN usermod -aG ssh ${USERNAME} \
    && sed -i 's/session\s*required\s*pam_loginuid\.so/session optional pam_loginuid.so/g' /etc/pam.d/sshd \
    && sed -i 's/#*PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config \
    && sed -i -E "s/#*\s*Port\s+.+/Port ${SSH_PORT}/g" /etc/ssh/sshd_config \
    && sed -i -E "s/#?\s*UsePAM\s+.+/UsePAM yes/g" /etc/ssh/sshd_config \
    && printf \
'#!/bin/sh \n\
if [ "${CODESPACES}" != "true" ] || [ "${VSCDC_FIXED_SECRETS}" = "true" ] || [ ! -z "${GITHUB_CODESPACES_TOKEN}" ]; then \n\
    # Not codespaces, already run, or secrets already in environment, so return \n\
    return \n\
fi \n\
if [ -f /workspaces/.codespaces/shared/.env ]; then \n\
    set -o allexport \n\
    . /workspaces/.codespaces/shared/.env \n\
    set +o allexport \n\
fi \n\
export VSCDC_FIXED_SECRETS=true' \
    > /etc/profile.d/00-restore-secrets.sh \
    && chmod +x /etc/profile.d/00-restore-secrets.sh \
    && echo "/etc/init.d/ssh start 2>&1 | echo >> /tmp/sshd.log" >> /usr/local/share/ssh-init.sh \
    && chmod +x /usr/local/share/ssh-init.sh \
    && /usr/local/share/ssh-init.sh \
    && echo "Done!\n\n- Port: ${SSH_PORT}\n- User: ${USERNAME}\n- Password: $(openssl rand -hex 16)" \
    && echo "\nForward port ${SSH_PORT} to your local machine and run:\n\n  ssh -p ${SSH_PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null ${USERNAME}@localhost\n"