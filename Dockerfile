# Use official Node.js Alpine image for a small footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the TypeScript code into the dist/ directory
RUN npm run build

# Expose the API port
EXPOSE 8080

# Run the compiled JavaScript output securely
CMD ["npm", "run", "start"]
