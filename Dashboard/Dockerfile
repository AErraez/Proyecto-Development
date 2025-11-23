# ------------------------------
# STATIC DASHBOARD + NGINX
# ------------------------------
FROM nginx:stable-alpine

# Copy your dashboard files into NGINX public folder
COPY . /usr/share/nginx/html

# Optional: custom nginx config (enables CORS)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# NGINX automatically runs as entrypoint
