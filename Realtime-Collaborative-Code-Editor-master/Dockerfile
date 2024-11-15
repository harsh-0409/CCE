FROM node:alpine

LABEL version="1.0"
LABEL description="Code Editor."
LABEL maintainer="mohitur669@gmail.com"

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

COPY . .

# Set environment variables
ENV REACT_APP_BACKEND_URL=http://localhost:5001
ENV SERVER_PORT=5001
ENV CLIENT_URL=http://localhost:3000

# Expose the necessary ports
EXPOSE 5001
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start:docker"]