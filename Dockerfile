# Use the official Node.js 23 Alpine image as the base image for a lightweight container
FROM node:23-alpine             

# Set the working directory inside the container to /app
WORKDIR /app                    

# Copy both package.json and package-lock.json for dependency installation consistency
COPY package*.json .            

# Install the dependencies defined in package.json
RUN npm install                 

# Expose port 5173 for the application to be accessible from outside the container
EXPOSE 5173                     

# Copy all files from the current directory to the container's working directory
COPY . .                        

# Start the application using npm run dev, which typically runs the development server
CMD [ "npm" , "run", "dev" ]    