#!/bin/bash
# should be run as root and only on Ubuntu 20/22, Debian 10/11 (Buster/Bullseye) versions!
echo "Welcome to the MediacMS installation!";

if [ `id -u` -ne 0 ]
  then echo "Please run as root"
  exit
fi


while true; do
    read -p "
This script will attempt to perform a system update and install services including PostgreSQL, nginx and Django.
It is expected to run on a new system **with no running instances of any these services**.
This has been tested only in Ubuntu Linux 22 and 24. Make sure you check the script before you continue. Then enter yes or no
" yn
    case $yn in
        [Yy]* ) echo "OK!"; break;;
        [Nn]* ) echo "Have a great day"; exit;;
        * ) echo "Please answer yes or no.";;
    esac
done

apt-get update && apt-get -y upgrade && apt-get install pkg-config python3-venv python3-dev virtualenv redis-server postgresql nginx git gcc vim unzip imagemagick procps libxml2-dev libxmlsec1-dev libxmlsec1-openssl python3-certbot-nginx certbot wget xz-utils -y

# install jellyfin-ffmpeg
echo "Downloading and installing jellyfin-ffmpeg"
JELLYFIN_FFMPEG_URL="https://fra1.mirror.jellyfin.org/main/ffmpeg/linux/latest-7.x/amd64/jellyfin-ffmpeg_7.1.3-1_portable_linux64-gpl.tar.gz"
wget -q "$JELLYFIN_FFMPEG_URL" -O /tmp/jellyfin-ffmpeg.tar.gz
mkdir -p /tmp/jellyfin-ffmpeg
tar -xf /tmp/jellyfin-ffmpeg.tar.gz -C /tmp/jellyfin-ffmpeg --strip-components=1
cp -v /tmp/jellyfin-ffmpeg/ffmpeg /usr/local/bin/ffmpeg
cp -v /tmp/jellyfin-ffmpeg/ffprobe /usr/local/bin/ffprobe
chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe
rm -rf /tmp/jellyfin-ffmpeg /tmp/jellyfin-ffmpeg.tar.gz
echo "jellyfin-ffmpeg installed to /usr/local/bin"

read -p "Enter portal URL, or press enter for localhost : " FRONTEND_HOST
read -p "Enter portal name, or press enter for 'MediaCMS : " PORTAL_NAME

[ -z "$PORTAL_NAME" ] && PORTAL_NAME='MediaCMS'
[ -z "$FRONTEND_HOST" ] && FRONTEND_HOST='localhost'

echo 'Creating database to be used in MediaCMS'

su -c "psql -c \"CREATE DATABASE mediacms\"" postgres
su -c "psql -c \"CREATE USER mediacms WITH ENCRYPTED PASSWORD 'mediacms'\"" postgres
su -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE mediacms TO mediacms\"" postgres
su -c "psql -d mediacms -c \"GRANT CREATE, USAGE ON SCHEMA public TO mediacms\"" postgres

echo 'Creating python virtualenv on /home/mediacms.io'

cd /home/mediacms.io
virtualenv . --python=python3
source  /home/mediacms.io/bin/activate
cd mediacms
pip install --no-binary lxml,xmlsec -r requirements.txt

SECRET_KEY=`python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`

# remove http or https prefix
FRONTEND_HOST=`echo "$FRONTEND_HOST" | sed -r 's/http:\/\///g'`
FRONTEND_HOST=`echo "$FRONTEND_HOST" | sed -r 's/https:\/\///g'`

sed -i s/localhost/$FRONTEND_HOST/g config/nginx/site-local.conf

FRONTEND_HOST_HTTP_PREFIX='http://'$FRONTEND_HOST

# Create custom directory and local_settings.py
mkdir -p custom

echo 'FRONTEND_HOST='\'"$FRONTEND_HOST_HTTP_PREFIX"\' >> custom/local_settings.py
echo 'PORTAL_NAME='\'"$PORTAL_NAME"\' >> custom/local_settings.py
echo "SSL_FRONTEND_HOST = FRONTEND_HOST.replace('http', 'https')" >> custom/local_settings.py

echo 'SECRET_KEY='\'"$SECRET_KEY"\' >> custom/local_settings.py
echo "LOCAL_INSTALL = True" >> custom/local_settings.py

# Database configuration for single server
echo "" >> custom/local_settings.py
echo "# Database configuration for single server installation" >> custom/local_settings.py
echo "DATABASES = {" >> custom/local_settings.py
echo "    'default': {" >> custom/local_settings.py
echo "        'ENGINE': 'django.db.backends.postgresql'," >> custom/local_settings.py
echo "        'NAME': 'mediacms'," >> custom/local_settings.py
echo "        'USER': 'mediacms'," >> custom/local_settings.py
echo "        'PASSWORD': 'mediacms'," >> custom/local_settings.py
echo "        'HOST': 'localhost'," >> custom/local_settings.py
echo "        'PORT': '5432'," >> custom/local_settings.py
echo "    }" >> custom/local_settings.py
echo "}" >> custom/local_settings.py

# Redis configuration for single server
echo "" >> custom/local_settings.py
echo "# Redis configuration for single server installation" >> custom/local_settings.py
echo "REDIS_LOCATION = 'redis://127.0.0.1:6379/1'" >> custom/local_settings.py
echo "CACHES = {" >> custom/local_settings.py
echo "    'default': {" >> custom/local_settings.py
echo "        'BACKEND': 'django_redis.cache.RedisCache'," >> custom/local_settings.py
echo "        'LOCATION': REDIS_LOCATION," >> custom/local_settings.py
echo "        'OPTIONS': {" >> custom/local_settings.py
echo "            'CLIENT_CLASS': 'django_redis.client.DefaultClient'," >> custom/local_settings.py
echo "        }," >> custom/local_settings.py
echo "    }" >> custom/local_settings.py
echo "}" >> custom/local_settings.py
echo "BROKER_URL = REDIS_LOCATION" >> custom/local_settings.py
echo "CELERY_RESULT_BACKEND = REDIS_LOCATION" >> custom/local_settings.py

mkdir logs
mkdir pids

ADMIN_PASS=`python -c "import secrets;chars = 'abcdefghijklmnopqrstuvwxyz0123456789';print(''.join(secrets.choice(chars) for i in range(10)))"`

echo "from django.contrib.sites.models import Site; Site.objects.update(name='$FRONTEND_HOST', domain='$FRONTEND_HOST')" | python manage.py shell

chown -R www-data. /home/mediacms.io/

# Install systemd services
# Set admin credentials in migrations service before copying
sed -i "/Environment=\"VIRTUAL_ENV=/a Environment=\"ADMIN_USER=admin\"\nEnvironment=\"ADMIN_EMAIL=admin@example.com\"\nEnvironment=\"ADMIN_PASSWORD=$ADMIN_PASS\"" config/systemd/mediacms-migrations.service
cp config/systemd/mediacms-migrations.service /etc/systemd/system/
cp config/systemd/mediacms-api.service /etc/systemd/system/
cp config/systemd/mediacms-celery-beat.service /etc/systemd/system/
cp config/systemd/mediacms-celery-short.service /etc/systemd/system/
cp config/systemd/mediacms-celery-long.service /etc/systemd/system/
cp config/systemd/mediacms.target /etc/systemd/system/

systemctl daemon-reload
systemctl enable mediacms.target
systemctl start mediacms.target

# Get admin password from migrations service logs
ADMIN_PASS_FROM_SERVICE=$(journalctl -u mediacms-migrations.service --no-pager | grep "Admin user created with password" | tail -1 | sed 's/.*password: //' || echo "$ADMIN_PASS")
if [ -n "$ADMIN_PASS_FROM_SERVICE" ] && [ "$ADMIN_PASS_FROM_SERVICE" != "$ADMIN_PASS" ]; then
    ADMIN_PASS="$ADMIN_PASS_FROM_SERVICE"
fi

mkdir -p /etc/letsencrypt/live/mediacms.io/
mkdir -p /etc/letsencrypt/live/$FRONTEND_HOST
mkdir -p /etc/nginx/sites-enabled
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/dhparams/
rm -rf /etc/nginx/conf.d/default.conf
rm -rf /etc/nginx/sites-enabled/default

# Copy SSL certificates with priority: custom/ssl/ first, then config/ssl/examples/ with warning
# Check for fullchain certificate
if [ -f "custom/ssl/mediacms.io_fullchain.pem" ]; then
    cp custom/ssl/mediacms.io_fullchain.pem /etc/letsencrypt/live/$FRONTEND_HOST/fullchain.pem
elif [ -f "custom/ssl/fullchain.pem" ]; then
    cp custom/ssl/fullchain.pem /etc/letsencrypt/live/$FRONTEND_HOST/fullchain.pem
else
    echo "WARNING: Using example SSL certificate from config/ssl/examples/"
    echo "For production, place your certificates in custom/ssl/"
    cp config/ssl/examples/mediacms.io_fullchain.pem /etc/letsencrypt/live/$FRONTEND_HOST/fullchain.pem
fi

# Check for private key
if [ -f "custom/ssl/mediacms.io_privkey.pem" ]; then
    cp custom/ssl/mediacms.io_privkey.pem /etc/letsencrypt/live/$FRONTEND_HOST/privkey.pem
elif [ -f "custom/ssl/privkey.pem" ]; then
    cp custom/ssl/privkey.pem /etc/letsencrypt/live/$FRONTEND_HOST/privkey.pem
else
    echo "WARNING: Using example SSL private key from config/ssl/examples/"
    echo "For production, place your certificates in custom/ssl/"
    cp config/ssl/examples/mediacms.io_privkey.pem /etc/letsencrypt/live/$FRONTEND_HOST/privkey.pem
fi

# Check for DH parameters
if [ -f "custom/ssl/dhparams.pem" ]; then
    cp custom/ssl/dhparams.pem /etc/nginx/dhparams/dhparams.pem
else
    echo "WARNING: Using example DH parameters from config/ssl/examples/"
    echo "For production, place your certificates in custom/ssl/"
    cp config/ssl/examples/dhparams.pem /etc/nginx/dhparams/dhparams.pem
fi

# Add sites-enabled include for single server
sed -i '/include \/etc\/nginx\/conf\.d\/\*\.conf;/a include /etc/nginx/sites-enabled/*;' config/nginx/nginx.conf
cp config/nginx/nginx.conf /etc/nginx/
cp config/nginx/site-local.conf /etc/nginx/sites-available/mediacms
ln -s /etc/nginx/sites-available/mediacms /etc/nginx/sites-enabled/mediacms

# Install log rotation configuration
cp config/logrotate/mediacms.conf /etc/logrotate.d/mediacms
chmod 644 /etc/logrotate.d/mediacms

systemctl stop nginx
systemctl start nginx

# attempt to get a valid certificate for specified domain

if [ "$FRONTEND_HOST" != "localhost" ]; then
    echo 'attempt to get a valid certificate for specified url $FRONTEND_HOST'
    certbot --nginx -n --agree-tos --register-unsafely-without-email -d $FRONTEND_HOST
    certbot --nginx -n --agree-tos --register-unsafely-without-email -d $FRONTEND_HOST
    # unfortunately for some reason it needs to be run two times in order to create the entries
    # and directory structure!!!
    systemctl restart nginx
else
    echo "will not call certbot utility to update ssl certificate for url 'localhost', using default ssl certificate"
fi

# Generate individual DH params
if [ "$FRONTEND_HOST" != "localhost" ]; then
    # Only generate new DH params when using "real" certificates.
    openssl dhparam -out /etc/nginx/dhparams/dhparams.pem 4096
    systemctl restart nginx
else
    echo "will not generate new DH params for url 'localhost', using default DH params"
fi

# Bento4 Python script installation, for HLS (matching Docker pattern)
echo "Installing Bento4 Python script for HLS"
BENTO4_DIR="/home/mediacms.io/mediacms/bento4"
mkdir -p "$BENTO4_DIR/utils"
git clone -b v1.6.0-637 https://github.com/axiomatic-systems/Bento4.git /tmp/bento4
cp -r /tmp/bento4/Source/Python/utils/* "$BENTO4_DIR/utils/"
chmod +x "$BENTO4_DIR/utils/mp4-hls.py"
rm -rf /tmp/bento4

# Create mp4hls wrapper script
cat > /usr/local/bin/mp4hls << 'EOF'
#!/bin/sh
BASEDIR="/home/mediacms.io/mediacms/bento4"
exec python3 "$BASEDIR/utils/mp4-hls.py" "$@"
EOF
chmod +x /usr/local/bin/mp4hls

# Create HLS directory
mkdir -p /home/mediacms.io/mediacms/media_files/hls

# last, set default owner
chown -R www-data. /home/mediacms.io/

echo 'MediaCMS installation completed, open browser on http://'"$FRONTEND_HOST"' and login with user admin and password '"$ADMIN_PASS"''
