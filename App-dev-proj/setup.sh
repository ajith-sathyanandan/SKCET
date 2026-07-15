
#!/bin/bash

# Set project directory
PROJECT_DIR="/home/coder/project/workspace/question_generation_service/solutions/2cfa029e-02f0-4a82-8338-b49851cb5ff9/springapp"

# Create unique database name from request ID
DATABASE_NAME="2cfa029e_02f0_4a82_8338_b49851cb5ff9"

# Create MySQL database
mysql -u root -pexamly -e "CREATE DATABASE IF NOT EXISTS ${DATABASE_NAME};" 2>/dev/null || echo "Database creation failed, will use default"

# Generate Spring Boot project using Spring CLI
spring init \
  --type=maven-project \
  --language=java \
  --boot-version=3.4.0 \
  --packaging=jar \
  --java-version=17 \
  --groupId=com.examly \
  --artifactId=springapp \
  --name="Restaurant Reservation System" \
  --description="Restaurant Table Reservation System with Spring Boot" \
  --package-name=com.examly.springapp \
  --dependencies=web,data-jpa,validation,mysql,lombok \
  --build=maven \
  ${PROJECT_DIR}

# Wait for project generation to complete
sleep 2

# Create application.properties with database configuration
mkdir -p ${PROJECT_DIR}/src/main/resources
cat > "${PROJECT_DIR}/src/main/resources/application.properties" << EOL
spring.datasource.url=jdbc:mysql://localhost:3306/${DATABASE_NAME}?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=examly
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=create
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
EOL
