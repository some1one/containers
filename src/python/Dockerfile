FROM some1one/containers:base

ARG USERNAME="vscode"
#the export prevents bugs with apt-installs and freezes due to expecting user interaction
RUN export DEBIAN_FRONTEND=noninteractive \
    #install base python tools and requirements
    && apt-get update && apt-get install --no-install-recommends -y \
        python3-venv \
        python3-dev \
        libssl-dev \
        zlib1g-dev \
        libbz2-dev \
        libreadline-dev \
        libsqlite3-dev \
        libncursesw5-dev \
        xz-utils \
        tk-dev \
        libxml2-dev \
        libxmlsec1-dev \
        libffi-dev \
        liblzma-dev \
    #prepare and install pyenv (a python version manager)
    && export $PYENV_ROOT="/usr/local/lib/pyenv" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv.git" "${PYENV_ROOT}" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv-doctor.git" "${PYENV_ROOT}/plugins/pyenv-doctor" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv-update.git" "${PYENV_ROOT}/plugins/pyenv-update" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv-virtualenv.git" "${PYENV_ROOT}/plugins/pyenv-virtualenv" \
    && ln ${PYENV_ROOT}/bin/pyenv /usr/local/bin/pyenv \
    && pyenv init --path && pyenv init - && pyenv virtualenv-init \
    && pyenv update