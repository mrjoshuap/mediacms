#!/bin/bash
# should be run as root on a rhel8-like system

function update_permissions
{
	# fix permissions of /srv/mediacms directory
	chown -R nginx:root $1
}

echo "Welcome to the MediacMS installation!";

if [ `id -u` -ne 0 ]; then
	echo "Please run as root user"
	exit
fi


while true; do
    read -p "
This script will attempt to perform a system update, install required dependencies, and configure PostgreSQL, NGINX, Redis and a few other utilities.
It is expected to run on a new system **with no running instances of any these services**. Make sure you check the script before you continue. Then enter y or n
" yn
    case $yn in
        [Yy]* ) echo "OK!"; break;;
        [Nn]* ) echo "Have a great day"; exit;;
        * ) echo "Please answer y or n.";;
    esac
done

# update configuration files

sed -i 's/www-data/nginx/g;s/\/home\/mediacms\.io\/mediacms\/logs/\/var\/log\/mediacms/g;s/\/home\/mediacms\.io\/mediacms/\/srv\/mediacms/g;s/\/home\/mediacms\.io\/bin/\/srv\/mediacms\/virtualenv\/bin/g' config/systemd/mediacms-celery-*.service
sed -i 's/\/home\/mediacms\.io\/mediacms/\/srv\/mediacms/g' config/nginx/site-local.conf
sed -i 's/www-data/nginx/g;s/\/home\/mediacms\.io\/bin/\/srv\/mediacms\/virtualenv\/bin/g;s/\/home\/mediacms\.io\/mediacms/\/srv\/mediacms/g' config/systemd/mediacms-api.service
sed -i 's/www-data/nginx/g;s/\/home\/mediacms\.io\/mediacms/\/srv\/mediacms/g;s/\/home\/mediacms\.io\/bin/\/srv\/mediacms\/virtualenv\/bin/g;s/\/home\/mediacms\.io/\/srv\/mediacms\/virtualenv/g' config/systemd/mediacms-migrations.service
sed -i 's/\/home\/mediacms\.io\/mediacms/\/var\/log\/mediacms/g' config/logrotate/mediacms.conf
sed -i 's/www-data/nginx/g' config/nginx/nginx.conf
sed -i 's/\/var\/log\/mediacms/\/var\/log\/nginx/g' config/nginx/nginx.conf

osVersion=

if [[ -f /etc/os-release ]]; then
	osVersion=$(grep ^ID /etc/os-release)
fi

if [[ $osVersion == *"fedora"* ]] || [[ $osVersion == *"rhel"*  ]] || [[ $osVersion == *"centos"* ]] || [[ *"rocky"* ]]; then
	dnf install -y epel-release https://mirrors.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm yum-utils
	yum-config-manager --enable powertools
	dnf install -y python3-virtualenv python39-devel redis postgresql postgresql-server nginx git gcc vim unzip ImageMagick python3-certbot-nginx certbot wget xz policycoreutils-devel cmake gcc gcc-c++ wget git bsdtar
else
    echo "unsupported or unknown os"
    exit -1
fi

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

# fix permissions of /srv/mediacms directory
update_permissions /srv/mediacms/

read -p "Enter portal URL, or press enter for localhost : " FRONTEND_HOST
read -p "Enter portal name, or press enter for 'MediaCMS : " PORTAL_NAME

[ -z "$PORTAL_NAME" ] && PORTAL_NAME='MediaCMS'
[ -z "$FRONTEND_HOST" ] && FRONTEND_HOST='localhost'

echo "Configuring postgres"
if [ ! command -v postgresql-setup > /dev/null 2>&1 ]; then
        echo "Something went wrong, the command 'postgresql-setup' was not found in the system path."
        exit -1
fi

postgresql-setup --initdb

# set authentication method for mediacms user to scram-sha-256
sed -i 's/.*password_encryption.*/password_encryption = scram-sha-256/' /var/lib/pgsql/data/postgresql.conf
sed -i '/# IPv4 local connections:/a host\tmediacms\tmediacms\t127.0.0.1/32\tscram-sha-256' /var/lib/pgsql/data/pg_hba.conf

systemctl enable postgresql.service --now

su -c "psql -c \"CREATE DATABASE mediacms\"" postgres
su -c "psql -c \"CREATE USER mediacms WITH ENCRYPTED PASSWORD 'mediacms'\"" postgres
su -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE mediacms TO mediacms\"" postgres

echo 'Creating python virtualenv on /srv/mediacms/virtualenv/'

mkdir /srv/mediacms/virtualenv/
cd /srv/mediacms/virtualenv/
virtualenv . --python=python3
source  /srv/mediacms/virtualenv/bin/activate
cd /srv/mediacms/
pip install -r requirements.txt

systemctl enable redis.service --now

SECRET_KEY=`python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`

# remove http or https prefix
FRONTEND_HOST=`echo "$FRONTEND_HOST" | sed -r 's/http:\/\///g'`
FRONTEND_HOST=`echo "$FRONTEND_HOST" | sed -r 's/https:\/\///g'`

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

mkdir /var/log/mediacms/
mkdir pids

update_permissions /var/log/mediacms/

ADMIN_PASS=`python -c "import secrets;chars = 'abcdefghijklmnopqrstuvwxyz0123456789';print(''.join(secrets.choice(chars) for i in range(10)))"`

echo "from django.contrib.sites.models import Site; Site.objects.update(name='$FRONTEND_HOST', domain='$FRONTEND_HOST')" | python manage.py shell

update_permissions /srv/mediacms/

# Install systemd services
# Set admin credentials in migrations service after path modifications
sed -i "/Environment=\"VIRTUAL_ENV=/a Environment=\"ADMIN_USER=admin\"\nEnvironment=\"ADMIN_EMAIL=admin@example.com\"\nEnvironment=\"ADMIN_PASSWORD=$ADMIN_PASS\"" config/systemd/mediacms-migrations.service
cp config/systemd/mediacms-migrations.service /etc/systemd/system/
cp config/systemd/mediacms-api.service /etc/systemd/system/
cp config/systemd/mediacms-celery-beat.service /etc/systemd/system/
cp config/systemd/mediacms-celery-short.service /etc/systemd/system/
cp config/systemd/mediacms-celery-long.service /etc/systemd/system/
cp config/systemd/mediacms.target /etc/systemd/system/

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

# Add sites-enabled include for single server
sed -i '/include \/etc\/nginx\/conf\.d\/\*\.conf;/a include /etc/nginx/sites-enabled/*;' config/nginx/nginx.conf
cp config/nginx/nginx.conf /etc/nginx/
cp config/nginx/site-local.conf /etc/nginx/sites-available/mediacms
ln -s /etc/nginx/sites-available/mediacms /etc/nginx/sites-enabled/mediacms

# Install log rotation configuration
cp config/logrotate/mediacms.conf /etc/logrotate.d/mediacms
chmod 644 /etc/logrotate.d/mediacms

# attempt to get a valid certificate for specified domain
while true ; do
        echo "Would you like to run [c]ertbot, or [s]kip?"
        read -p " : " certbotConfig

        case $certbotConfig in
        [cC*] )
		if [ "$FRONTEND_HOST" != "localhost" ]; then
			systemctl start
			echo 'attempt to get a valid certificate for specified url $FRONTEND_HOST'
			certbot --nginx -n --agree-tos --register-unsafely-without-email -d $FRONTEND_HOST
			certbot --nginx -n --agree-tos --register-unsafely-without-email -d $FRONTEND_HOST
			# unfortunately for some reason it needs to be run two times in order to create the entries
			# and directory structure!!!
			systemctl stop nginx

			# Generate individual DH params
			openssl dhparam -out /etc/nginx/dhparams/dhparams.pem 4096
		fi

                break
                ;;
        [sS*] )
		echo "will not call certbot utility to update ssl certificate for url 'localhost', using default ssl certificate"
		# Check for DH parameters with priority: custom/ssl/ first, then config/ssl/examples/ with warning
		if [ -f "custom/ssl/dhparams.pem" ]; then
		    cp custom/ssl/dhparams.pem /etc/nginx/dhparams/dhparams.pem
		else
		    echo "WARNING: Using example DH parameters from config/ssl/examples/"
		    echo "For production, place your certificates in custom/ssl/"
		    cp config/ssl/examples/dhparams.pem /etc/nginx/dhparams/dhparams.pem
		fi

                break
                ;;
        * )
                echo "Unknown option: $certbotConfig"
                ;;
        esac
done

# Bento4 Python script installation, for HLS (matching Docker pattern)
echo "Installing Bento4 Python script for HLS"
BENTO4_DIR="/srv/mediacms/bento4"
mkdir -p "$BENTO4_DIR/utils"
git clone -b v1.6.0-637 https://github.com/axiomatic-systems/Bento4.git /tmp/bento4
cp -r /tmp/bento4/Source/Python/utils/* "$BENTO4_DIR/utils/"
chmod +x "$BENTO4_DIR/utils/mp4-hls.py"
rm -rf /tmp/bento4

# Create mp4hls wrapper script
cat > /usr/local/bin/mp4hls << 'EOF'
#!/bin/sh
BASEDIR="/srv/mediacms/bento4"
exec python3 "$BASEDIR/utils/mp4-hls.py" "$@"
EOF
chmod +x /usr/local/bin/mp4hls

# Create HLS directory
mkdir -p /srv/mediacms/media_files/hls

# update permissions

update_permissions /srv/mediacms/

# configure selinux

while true ; do
        echo "Configuring SELinux"
        echo "Would you like to [d]isable SELinux until next reboot, [c]onfigure our SELinux module, or [s]kip and not do any SELinux confgiguration?"
        read -p "d/c/s : " seConfig

        case $seConfig in
        [Dd]* )
                echo "Disabling SELinux until next reboot"
                break
                ;;
        [Cc]* )
                echo "Configuring custom mediacms selinux module"

		semanage fcontext -a -t bin_t /srv/mediacms/virtualenv/bin/
		semanage fcontext -a -t httpd_sys_content_t "/srv/mediacms(/.*)?"
		restorecon -FRv /srv/mediacms/

		sebools=(httpd_can_network_connect httpd_graceful_shutdown httpd_can_network_relay nis_enabled httpd_setrlimit domain_can_mmap_files)

		for bool in "${sebools[@]}"
		do
			setsebool -P $bool 1
		done

		cd /srv/mediacms/config/selinux/
		make -f /usr/share/selinux/devel/Makefile -f /usr/share/selinux/devel/Makefile mediacms.pp
		semodule -i mediacms.pp

                break
                ;;
        [Ss]* )
                echo "Skipping SELinux configuration"
                break
                ;;
        * )
                echo "Unknown option: $seConfig"
                ;;
        esac
done

# configure firewall
if command -v firewall-cmd > /dev/null 2>&1 ; then
	while true ; do
	        echo "Configuring firewall"
	        echo "Would you like to configure http, https, or skip and not do any firewall configuration?"
	        read -p "http/https/skip : " fwConfig

		case $fwConfig in
	        http )
	                echo "Opening port 80 until next reboot"
			firewall-cmd --add-port=80/tcp
	                break
	                ;;
	        https )
			echo "Opening port 443 permanently"
			firewall-cmd --add-port=443/tcp --permanent
			firewall-cmd --reload
	                break
	                ;;
	        skip )
	                echo "Skipping firewall configuration"
	                break
	                ;;
	        * )
	                echo "Unknown option: $fwConfig"
	                ;;
	        esac
	done

fi

systemctl daemon-reload
systemctl enable mediacms.target
systemctl start mediacms.target

# Get admin password from migrations service logs (if available)
ADMIN_PASS_FROM_SERVICE=$(journalctl -u mediacms-migrations.service --no-pager -n 50 2>/dev/null | grep "Admin user created with password" | tail -1 | sed 's/.*password: //' || echo "$ADMIN_PASS")
if [ -n "$ADMIN_PASS_FROM_SERVICE" ] && [ "$ADMIN_PASS_FROM_SERVICE" != "$ADMIN_PASS" ]; then
    ADMIN_PASS="$ADMIN_PASS_FROM_SERVICE"
fi

echo 'MediaCMS installation completed, open browser on http://'"$FRONTEND_HOST"' and login with user admin and password '"$ADMIN_PASS"''
