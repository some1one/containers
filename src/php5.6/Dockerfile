FROM some1one/containers:node

ARG USERNAME="vscode"
#the export prevents bugs with apt-installs and freezes due to expecting user interaction
RUN export DEBIAN_FRONTEND=noninteractive \
    #add legacy php repository (the ppa:ondrej/php has been added to the following for debian)
    && curl -sS https://packages.sury.org/php/apt.gpg | gpg --dearmor > /usr/share/keyrings/sury-php-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/sury-php-archive-keyring.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list \
    #install php, plugins, and tools
    && apt-get update && apt-get -y install --no-install-recommends \
        pkg-php-tools \
        php5.6 \
        php5.6-zip \
        php5.6-bcmath \
        php5.6-curl \
        php5.6-mysqli \
        php5.6-intl \
        php5.6-mbstring \
        php5.6-fpm \
        php5.6-common \
        php5.6-json \
        php5.6-xml \
        php5.6-readline \
        php5.6-cli \
        php5.6-opcache \
        php5.6-redis \
        php5.6-yaml \
        php5.6-mcrypt \
        php5.6-xdebug \
        php5.6-dev \
        php-pear \
        redis-server \
        #libyaml-dev --already included in base image
    #cleanup apt
    && apt-get autoremove -y \
    #install composer
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    #setup xdebug
    && export XDEBUG_LOG_FOLDER="/var/log/xdebug" \
    && groupadd -r xdebug \
    && umask 0002 \
    && usermod -a -G xdebug $USERNAME \
    && mkdir -p $XDEBUG_LOG_FOLDER \
    && chown :xdebug $XDEBUG_LOG_FOLDER \
    && chmod g+s $XDEBUG_LOG_FOLDER \
    && echo "xdebug.remote_enable=1" >> /etc/php/5.6/mods-available/xdebug.ini \
    && echo "xdebug.remote_host=host.docker.internal" >> /etc/php/5.6/mods-available/xdebug.ini \
    && echo "xdebug.remote_log='${XDEBUG_LOG_FOLDER}/xdebug.log'" >> /etc/php/5.6/mods-available/xdebug.ini