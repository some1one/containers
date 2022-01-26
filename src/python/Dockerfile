FROM some1one/containers:base

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
    && apt-get autoremove -y \
    #prepare and install pyenv (a python version manager)
    && export PYENV_ROOT="/usr/local/lib/pyenv" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv.git" "${PYENV_ROOT}" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv-doctor.git" "${PYENV_ROOT}/plugins/pyenv-doctor" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv-update.git" "${PYENV_ROOT}/plugins/pyenv-update" \
    && git clone --depth 1 "https://github.com/pyenv/pyenv-virtualenv.git" "${PYENV_ROOT}/plugins/pyenv-virtualenv" \
    && cd $PYENV_ROOT && src/configure && make -C src && cd / \
    && ln -s ${PYENV_ROOT}/bin/pyenv /usr/local/bin/pyenv \
    && eval "$(pyenv init --path)" && eval "$(pyenv init -)" && eval "$(pyenv virtualenv-init -)" \
    && pyenv update \
    #setup python 3.9 as default
    && pyenv install 3.9.10 && pyenv global 3.9.10 && pyenv shell 3.9.10 \
    #setup pyenv for all users
    && echo 'export PYENV_ROOT="/usr/local/lib/pyenv"' >> "/etc/profile.d/pyenv.sh" \
    && echo 'eval "$(pyenv init --path)"' >> "/etc/profile.d/pyenv.sh" \
    && echo 'eval "$(pyenv init -)"' >> "/etc/profile.d/pyenv.sh" \
    && echo 'eval "$(pyenv virtualenv-init -)"' >> "/etc/profile.d/pyenv.sh" \
    && echo "pyenv shell 3.9.10" >> "/etc/profile.d/pyenv.sh" \
    #update pip
    && pip install --upgrade pip