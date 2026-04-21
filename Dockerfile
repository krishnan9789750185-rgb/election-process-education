# Use the official Nginx image based on Alpine Linux
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static web files to the Nginx html directory
COPY . /usr/share/nginx/html

# Expose port 8080 (Cloud Run expects 8080 by default)
EXPOSE 8080

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
