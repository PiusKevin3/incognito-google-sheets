# Use Node.js LTS base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy the full app source code
COPY . .

# # Copy dependency definitions first
# COPY package*.json ./

# Install dependencies
RUN npm install



# Expose the port your app listens on (if applicable; update if different)
EXPOSE 4000

# Start the app
CMD ["node", "app.js"]
