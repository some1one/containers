FROM some1one/containers:vsc-base

ARG USERNAME="vscode"
ARG NODE_VERSION="lts/*"
RUN export DEBIAN_FRONTEND=noninteractive \
    #install yarn
    && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor > /usr/share/keyrings/yarn-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list \
    && apt-get update \
    && apt-get -y install --no-install-recommends yarn \
    #set up nvm
    && export NVM_DIR="/usr/local/share/nvm" \
    && export NODE_VERSION="${NODE_VERSION}" \
    && export NVM_SYMLINK_CURRENT=true \
    && groupadd -r nvm \
    && umask 0002 \
    && usermod -a -G nvm $USERNAME \
    && mkdir -p $NVM_DIR \
    && chown :nvm $NVM_DIR \
    && chmod g+s $NVM_DIR \
    && su ${USERNAME} -c "set -e && umask 0002 && export PROFILE=/dev/null && curl -so- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash" 2>&1 \
    #install node
    && su ${USERNAME} -c "set -e && umask 0002 && export PROFILE=/dev/null && source ${NVM_DIR}/nvm.sh && nvm alias default ${NODE_VERSION}" 2>&1 \
    && su ${USERNAME} -c "set -e && umask 0002 && export PROFILE=/dev/null && source ${NVM_DIR}/nvm.sh && nvm clear-cache" 2>&1 \
    && echo "export NVM_DIR='${NVM_DIR}'" >> /etc/bash.bashrc \
    && printf \
'[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" \n\
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"' \
    >> /etc/bash.bashrc \
    #update npm, npx, and install global tools
    && su ${USERNAME} -c "source ${NVM_DIR}/nvm.sh && npm install -g npm" 2> /dev/null \
    && su ${USERNAME} -c "source ${NVM_DIR}/nvm.sh && npm install --force -g npx" 2> /dev/null \
    && su ${USERNAME} -c "source ${NVM_DIR}/nvm.sh && npm install -g typescript eslint prettier"