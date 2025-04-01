# Use official OpenJDK as base image
FROM openjdk:17-alpine

# Set working directory inside the container
WORKDIR /app

# Copy the Java file into the container
COPY A.java .

# Compile the Java file
RUN javac a.java

# Command to run the Java program
CMD ["java", "a"]
