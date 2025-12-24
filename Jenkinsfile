
pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = credentials('dockerhub-creds')
        DOCKERHUB_USER  = 'sumitroy161'
        BACKEND_IMAGE   = 'sumitroy161/chat-app:backend'
        FRONTEND_IMAGE  = 'sumitroy161/chat-app:frontend'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh '''
                      docker build -t $BACKEND_IMAGE .
                    '''
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh '''
                      docker build -t $FRONTEND_IMAGE .
                    '''
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                sh '''
                  echo $DOCKERHUB_CREDS_PSW | docker login \
                  -u $DOCKERHUB_CREDS_USR --password-stdin
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh '''
                  docker push $BACKEND_IMAGE
                  docker push $FRONTEND_IMAGE
                '''
            }
        }

        stage('Deploy to kind') {
            steps {
                sh '''
          echo "Applying backend & frontend manifests..."

          kubectl apply -f k8s/backend/deployment.yaml
          kubectl apply -f k8s/backend/service.yaml
          kubectl apply -f k8s/frontend/deployment.yaml
          kubectl apply -f k8s/frontend/service.yaml

          echo "Restarting deployments to pull new images..."

          kubectl rollout restart deployment/backend
          kubectl rollout restart deployment/frontend

          kubectl rollout status deployment/backend
          kubectl rollout status deployment/frontend
        '''
            }
        }
    }

    post {
        success {
            echo '✅ CI Pipeline completed successfully'
        }
        failure {
            echo '❌ CI Pipeline failed'
        }
    }
}
