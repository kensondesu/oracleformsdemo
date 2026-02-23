FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Place config in the templates directory so nginx-docker runs envsubst on startup
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Default upstream host (override with -e BACKEND_HOST=<name> at runtime)
ENV BACKEND_HOST=backend
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
